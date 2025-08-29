"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, useCallback } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { exportSignListToExcel } from "@/lib/exportSignListToExcel";
import { SignOrderList } from "../new/SignOrderList";
import { SignOrderAdminInfo } from "../new/SignOrderAdminInfo";
import { toast } from "sonner";
import { User } from "@/types/User";
import { Customer } from "@/types/Customer";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import PageHeaderWithSaving from "@/components/PageContainer/PageHeaderWithSaving";
import { fetchAssociatedFiles, fetchReferenceData, saveSignOrder } from "@/lib/api-client";
import isEqual from "lodash/isEqual";
import EquipmentTotalsAccordion from "./view/[id]/EquipmentTotalsAccordion";
import { QuoteNotes, Note } from "@/components/pages/quote-form/QuoteNotes";
import {
  defaultMPTObject,
  defaultPhaseObject,
} from "@/types/default-objects/defaultMPTObject";
import { useLoading } from "@/hooks/use-loading";
import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";
import { formatDate } from "@/lib/formatUTCDate";
import FileViewingContainer from "@/components/file-viewing-container";
import { FileMetadata } from "@/types/FileTypes";
import { useAuth } from "@/contexts/auth-context";
import SignOrderWorksheetPDF from "@/components/sheets/SignOrderWorksheetPDF";
import { SignItem } from "@/components/sheets/SignOrderWorksheetPDF";
import SignOrderWorksheet from "@/components/sheets/SignOrderWorksheet";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { useMemo } from "react";

export type OrderTypes = "sale" | "rental" | "permanent signs";

export interface SignOrderAdminInformation {
  requestor: User | null;
  customer: Customer | null;
  orderDate: Date;
  needDate: Date | null;
  orderType: OrderTypes[];
  selectedBranch: string;
  jobNumber: string;
  isSubmitting: boolean;
  contractNumber: string;
  orderNumber?: string;
  startDate?: Date;
  endDate?: Date;
  contact?: any | null;
}

interface Props {
  signOrderId?: number;
}

export default function SignOrderContentSimple({
  signOrderId: initialSignOrderId,
}: Props) {
  const { dispatch, mptRental } = useEstimate();
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const { user } = useAuth();
  const [adminInfo, setAdminInfo] = useState<SignOrderAdminInformation>({
    requestor: null,
    customer: null,
    orderDate: new Date(),
    needDate: null,
    orderType: [],
    selectedBranch: "All",
    jobNumber: "",
    isSubmitting: false,
    contractNumber: "",
    orderNumber: undefined,
    contact: null,
  });
  const [signList, setSignList] = useState<SignItem[]>([]);
  const [localFiles, setLocalFiles] = useState<FileMetadata[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean>(false);
  const [signOrderId, setSignOrderId] = useState<number | null>(
    initialSignOrderId ?? null
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [secondCounter, setSecondCounter] = useState<number>(0);
  const saveTimeoutRef = useRef<number | null>(null);
  const [firstSave, setFirstSave] = useState<boolean>(false);
  const prevStateRef = useRef({ adminInfo, mptRental });
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const isOrderInvalid = useCallback((): boolean => {
    return (
      !adminInfo.contractNumber ||
      adminInfo.contractNumber.trim() === "" ||
      !adminInfo.customer ||
      !adminInfo.requestor ||
      adminInfo.orderType.length === 0 ||
      !adminInfo.orderDate ||
      !adminInfo.needDate
    );
  }, [adminInfo]); // Fixed line 96

  const autosave = useCallback(async () => {
    setIsSaving(true);
    if (isOrderInvalid()) return;

    prevStateRef.current = { adminInfo, mptRental };

    try {
      const signOrderData = {
        id: signOrderId || undefined,
        requestor: adminInfo.requestor ? adminInfo.requestor : undefined,
        contractor_id: adminInfo.customer ? adminInfo.customer.id : undefined,
        contract_number: adminInfo.contractNumber,
        order_date: new Date(adminInfo?.orderDate).toISOString(),
        need_date: adminInfo.needDate ? new Date(adminInfo?.needDate).toISOString() : undefined,
        start_date: adminInfo.startDate ? new Date(adminInfo.startDate).toISOString() : "",
        end_date: adminInfo.endDate ? new Date(adminInfo.endDate).toISOString() : "",
        order_type: adminInfo.orderType,
        job_number: adminInfo.jobNumber,
        signs: mptRental.phases[0].signs || [],
        status: "DRAFT" as const,
        order_number: adminInfo.orderNumber,
        contact: adminInfo.contact,
      };

      const result = await saveSignOrder(signOrderData);

      if (result.id && !signOrderId) {
        setSignOrderId(result.id);
        setFirstSave(true);
      }

      setSecondCounter(1);
      if (!firstSave) setFirstSave(true);
    } catch (error) {
      toast.error("Sign order not successfully saved as draft: " + error);
    } finally {
      setIsSaving(false);
    }
  }, [adminInfo, mptRental, signOrderId, firstSave]); // Fixed line 268

  const fetchSignOrder = async (initialSignOrderId: number) => {
    try {
      startLoading();
      setLoadingNotes(true);
      console.log(`Fetching sign order with ID: ${initialSignOrderId}`);
      const response = await fetch(`/api/sign-orders/${initialSignOrderId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("API response not OK:", response.status, data);
        throw new Error(
          `Failed to fetch sign order: ${data.message || response.statusText}`
        );
      }

      console.log("Sign order data:", data);
      if (!data.success || !data.data) {
        console.error("Invalid API response format:", data);
        throw new Error("Invalid API response format");
      }

      const users = await fetchReferenceData("users");
      const orderWithBranch = {
        ...data.data,
        branch: users.find((u: any) => u.name === data.data.requestor)?.branches
          ?.name || "",
      };

      const ordersData: OrderTypes[] = [];
      if (data.data.perm_signs) ordersData.push("permanent signs");
      if (data.data.sale) ordersData.push("sale");
      if (data.data.rental) ordersData.push("rental");

      setAdminInfo({
        contractNumber: data.data.contract_number,
        requestor: {
          name: data.data.requestor,
          email: "",
          role: "",
        },
        orderDate:
          data.data.order_date && data.data.order_date !== ""
            ? new Date(formatDate(data.data.order_date))
            : new Date(),
        needDate:
          data.data.need_date && data.data.need_date !== ""
            ? new Date(formatDate(data.data.need_date))
            : new Date(),
        jobNumber: data.data.job_number,
        startDate:
          data.data.start_date && data.data.start_date !== ""
            ? new Date(formatDate(data.data.start_date))
            : undefined,
        endDate:
          data.data.end_date && data.data.end_date !== ""
            ? new Date(formatDate(data.data.end_date))
            : undefined,
        selectedBranch: orderWithBranch.branch,
        customer: {
          id: data.data.contractor_id,
          name: data.data.contractors?.name,
          displayName: data.data.contractors?.name,
          emails: [],
          address: "",
          phones: [],
          paymentTerms: "",
          mainPhone: "",
          zip: "",
          roles: [],
          names: [],
          contactIds: [],
          url: "",
          created: "",
          updated: "",
          city: "",
          state: "",
          customerNumber: 1,
        },
        isSubmitting: false,
        orderType: ordersData,
        orderNumber: data.data.order_number || undefined,
      });

      if (data.data.order_status === "SUBMITTED") {
        setAlreadySubmitted(true);
      }

      if (data.data.signs) {
        try {
          const signItemsArray = Object.values(data.data.signs)
            .filter((s: any) => s && typeof s === "object")
            .map((s: any) => ({
              ...s,
              id: s.id ? s.id : generateUniqueId(),
              bLights: s.bLights || 0,
            }));

          dispatch({
            type: "COPY_MPT_RENTAL",
            payload: {
              ...defaultMPTObject,
              phases: [{ ...defaultPhaseObject, signs: signItemsArray }],
            },
          });
        } catch (error) {
          toast.error("Error parsing signs data: " + error);
          console.error("Error parsing signs data:", error);
        }
      } else {
        console.log("No signs data found in the sign order");
      }
    } catch (error) {
      toast.error("Error fetching sign order: " + error);
      console.error("Error fetching sign order:", error);
      setLoadingNotes(false);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    dispatch({ type: "ADD_MPT_RENTAL" });
    if (!initialSignOrderId) {
      dispatch({ type: "ADD_MPT_PHASE" });
    } else {
      fetchSignOrder(initialSignOrderId);
    }
  }, [dispatch, initialSignOrderId]); // Original dependencies (line 235)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondCounter((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [secondCounter]); // Original dependencies (line 293)

  useEffect(() => {
    const hasAdminInfoChanged = !isEqual(adminInfo, prevStateRef.current.adminInfo);
    const hasMptRentalChanged = !isEqual(mptRental, prevStateRef.current.mptRental);
    const hasAnyStateChanged = hasAdminInfoChanged || hasMptRentalChanged;

    if (isOrderInvalid() || !hasAnyStateChanged) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSignList(mptRental.phases[0].signs.map(normalizeSign));
    saveTimeoutRef.current = window.setTimeout(() => {
      autosave();
    }, 5000);
  }, [adminInfo, mptRental, autosave, isOrderInvalid]); // Fixed line 258

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const getSaveStatusMessage = () => {
    if (isSaving && !firstSave) return "Saving...";
    if (!firstSave) return "";
    if (secondCounter < 60) {
      return `${alreadySubmitted ? "Sign order updates" : "Draft"} saved ${secondCounter} second${secondCounter !== 1 ? "s" : ""} ago`;
    } else if (secondCounter < 3600) {
      const minutesAgo = Math.floor(secondCounter / 60);
      return `${alreadySubmitted ? "Sign order updates" : "Draft"} saved ${minutesAgo} minute${minutesAgo !== 1 ? "s" : ""} ago`;
    } else {
      const hoursAgo = Math.floor(secondCounter / 3600);
      return `${alreadySubmitted ? "Sign order" : "Draft"} saved ${hoursAgo} hour${hoursAgo !== 1 ? "s" : ""} ago`;
    }
  };

  const fileUploadProps = useFileUpload({
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 10,
    uniqueIdentifier: signOrderId ?? "",
    apiEndpoint: "/api/files/sign-orders",
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "application/zip": [".zip"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
  });

  const { files, successes, isSuccess, errors: fileErrors } = fileUploadProps;

  const fetchFiles = useCallback(() => {
    if (!signOrderId) return;
    fetchAssociatedFiles(signOrderId, "sign-orders?sign_order_id", setLocalFiles);
  }, [signOrderId, setLocalFiles]); // Fixed line 349

  useEffect(() => {
    fetchFiles();
  }, [signOrderId]); // Original dependencies (line 356)

  useEffect(() => {
    if (isSuccess && files.length > 0) {
      fetchFiles();
    }
  }, [isSuccess, files, successes]); // Original dependencies (line 362)

  useEffect(() => {
    async function fetchNotes() {
      setLoadingNotes(true);
      try {
        if (!signOrderId) return;
        const res = await fetch(`/api/sign-orders?id=${signOrderId}`);
        if (res.ok) {
          const data = await res.json();
          setNotes(Array.isArray(data.notes) ? data.notes : []);
        }
      } finally {
        setLoadingNotes(false);
      }
    }
    fetchNotes();
  }, [signOrderId]);

  const handleSaveNote = async (note: Note) => {
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    if (signOrderId) {
      await fetch(`/api/sign-orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: signOrderId,
          timestamp: note.timestamp,
          notes: updatedNotes,
          user_email: user.email,
        }),
      });
    }
  };

  const handleEditNote = async (index: number, updatedNote: Note) => {
    const updatedNotes = notes.map((n, i) => (i === index ? updatedNote : n));
    setNotes(updatedNotes);
    if (signOrderId) {
      await fetch(`/api/sign-orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: signOrderId, notes: updatedNotes }),
      });
    }
  };

  const handleDeleteNote = async (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    if (signOrderId) {
      await fetch(`/api/sign-orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: signOrderId, notes: updatedNotes }),
      });
    }
  };

  const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
    if (adminInfo.isSubmitting) return;
    if (isOrderInvalid()) return;

    try {
      setAdminInfo((prev) => ({ ...prev, isSubmitting: true }));

      const signOrderData = {
        id: signOrderId || undefined,
        requestor: adminInfo.requestor ? adminInfo.requestor : undefined,
        contractor_id: adminInfo.customer ? adminInfo.customer.id : undefined,
        contract_number: adminInfo.contractNumber,
        order_date: new Date(adminInfo?.orderDate).toISOString(),
        need_date: adminInfo.needDate ? new Date(adminInfo?.needDate).toISOString() : undefined,
        start_date: adminInfo.startDate ? new Date(adminInfo.startDate).toISOString() : "",
        end_date: adminInfo.endDate ? new Date(adminInfo.endDate).toISOString() : "",
        order_type: adminInfo.orderType,
        job_number: adminInfo.jobNumber,
        signs: mptRental.phases[0].signs || [],
        status,
        order_number: adminInfo.orderNumber,
        contact: adminInfo.contact,
      };

      const result = await saveSignOrder(signOrderData);

      if (result.id) {
        setSignOrderId(result.id);
      }
      setFirstSave(true);

      toast.success("Sign order saved successfully");
      router.push("/takeoffs/sign-order/view/" + (signOrderId || result.id));
    } catch (error) {
      console.error("Error saving sign order:", error);
      toast.error((error as string) || "Failed to save sign order");
    } finally {
      setAdminInfo((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const pdfDoc = useMemo(
    () => (
      <SignOrderWorksheetPDF
        adminInfo={adminInfo}
        signList={signList}
        mptRental={mptRental}
        notes={notes}
      />
    ),
    [adminInfo, signList, mptRental, notes]
  );

  return mptRental.phases.length > 0 ? (
    <div className="flex flex-1">
      {/* Left Half: Sign Order Form */}
      <div className="w-1/2 p-6 space-y-6">
        <PageHeaderWithSaving
          heading="Create Sign Order"
          handleSubmit={() => {
            handleSave("DRAFT");
            router.push("/takeoffs/load-sheet");
          }}
          showX
          saveButtons={
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {getSaveStatusMessage()}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    handleSave(alreadySubmitted ? "SUBMITTED" : "DRAFT")
                  }
                  disabled={
                    adminInfo.isSubmitting ||
                    mptRental.phases[0].signs.length === 0 ||
                    isOrderInvalid()
                  }
                >
                  {adminInfo.isSubmitting
                    ? "Saving..."
                    : initialSignOrderId
                    ? "Update order"
                    : "Done"}
                </Button>
              </div>
            </div>
          }
        />
        <SignOrderAdminInfo
          adminInfo={adminInfo}
          setAdminInfo={setAdminInfo}
          showInitialAdminState={!!initialSignOrderId}
        />
        <SignOrderList />
        <EquipmentTotalsAccordion />
        <div className="border rounded-lg p-4">
          <h2 className="mb-2 text-lg font-semibold">Files</h2>
          <Dropzone
            {...fileUploadProps}
            className="p-8 cursor-pointer space-y-4 mb-4"
          >
            <DropzoneContent />
            <DropzoneEmptyState />
          </Dropzone>
          <FileViewingContainer files={localFiles} onFilesChange={setLocalFiles} />
        </div>
        <QuoteNotes
          notes={notes}
          onSave={handleSaveNote}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          loading={loadingNotes}
        />
      </div>
      {/* Right Half: PDF Preview */}
      <div className="w-1/2 bg-[#F4F5F7] p-6 flex flex-col">
        <div className="flex justify-end mb-4">
          <PDFDownloadLink document={pdfDoc} fileName="sign-order.pdf">
            <Button>Download PDF</Button>
          </PDFDownloadLink>
        </div>
        <div className="flex-1 overflow-y-auto bg-white rounded-lg">
          <PDFViewer className="w-full h-full">
            {pdfDoc}
          </PDFViewer>
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
}

const normalizeSign = (sign: any): SignItem => ({
  designation: sign.designation || "",
  description: sign.description || "",
  quantity: sign.quantity || 0,
  width: sign.width || 0,
  height: sign.height || 0,
  sheeting: sign.sheeting || "",
  substrate: sign.substrate || "",
  stiffener:
    typeof sign.stiffener === "string" || typeof sign.stiffener === "boolean"
      ? sign.stiffener
      : "",
  inStock: sign.inStock ?? 0,
  order: sign.order ?? 0,
  displayStructure: sign.displayStructure || "",
  bLights: sign.bLights || 0,
  cover: sign.cover || false,
  make: sign.make ?? 0,
  unitPrice: sign.unitPrice ?? undefined,
  totalPrice: sign.totalPrice ?? undefined,
  primarySignId: sign.primarySignId ?? undefined,
});

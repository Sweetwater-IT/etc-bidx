"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  FileText,
  ClipboardList,
  StickyNote,
  FolderOpen,
  User2,
  Info,
  File,
  ChevronDown,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  IconDotsVertical,
  IconTrash,
  IconClipboard,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function JobSummaryPage() {
  // Dados mockados para exibição
  const jobNumber = "30-22-2025037";
  const billingStatus = "In progress";
  const projectStatus = "Not Started";
  const customerInfo = {
    customer: "Allan Myers",
    contract: "231",
    manager: "231321",
    email: "1212@211212.com",
    phone: "(123) 123-1231",
  };
  const bidPhases = [
    {
      name: "I",
      start: "12.11.2024",
      end: "12.11.2025",
      products: [
        { name: "4'Ft Type III", params: 333, value: "", actions: true },
        { name: "H Stands", params: 0, value: 23, actions: true },
        { name: "Sand Bags", params: 12, value: "", actions: true },
        { name: "Covers", params: 0, value: "", actions: true },
        {
          name: "Spring Loader Metal Stands",
          params: 0,
          value: "",
          actions: true,
        },
        {
          name: "Type XI Vertical Panels",
          params: 0,
          value: "",
          actions: true,
        },
        { name: "B-Lites", params: 0, value: 2, actions: true },
        { name: "A / C Lites", params: 342, value: 222, actions: true },
      ],
    },
  ];
  const [infoTab, setInfoTab] = useState<"admin" | "customer">("customer");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6 px-6">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Breadcrumbs & Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Dashboard / Estimating / Jobs
                      </div>
                      <h1 className="text-2xl font-bold">
                        Job number{" "}
                        <span className="font-mono">{jobNumber}</span>
                      </h1>
                    </div>
                    <div className="flex gap-4 mt-4 md:mt-0">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Billing Status:
                        </div>
                        <div className="font-medium bg-orange-100/95 text-orange-800 rounded px-2 py-1 text-xs inline-block">
                          {billingStatus}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Project Status:
                        </div>
                        <div className="font-medium bg-gray-100/95 text-gray-800 rounded px-2 py-1 text-xs inline-block">
                          {projectStatus}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* BID PHASE SUMMARY */}
                  <div className="bg-card rounded-xl border shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h2 className="text-lg font-semibold">
                        BID PHASE SUMMARY
                      </h2>
                      <div className="flex gap-2 mt-2 md:mt-0">
                        <input
                          type="text"
                          placeholder="Search..."
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <Button variant="outline" size="sm">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                    {/* Phases Tabs */}
                    <div className="flex gap-2 mb-4">
                      {bidPhases.map((phase, idx) => (
                        <Button
                          key={idx}
                          variant={idx === 0 ? "default" : "outline"}
                          size="sm"
                        >
                          {phase.name}
                        </Button>
                      ))}
                      <Button variant="ghost" size="sm">
                        + Add Phase
                      </Button>
                    </div>
                    {/* Dates & Toggles */}
                    <div className="flex gap-4 items-center mb-4">
                      <input
                        type="text"
                        value={bidPhases[0].start}
                        className="border rounded px-2 py-1 text-sm w-32"
                        readOnly
                      />
                      <span>-</span>
                      <input
                        type="text"
                        value={bidPhases[0].end}
                        className="border rounded px-2 py-1 text-sm w-32"
                        readOnly
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" className="accent-primary" />{" "}
                        Hide empty fields
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" className="accent-primary" /> Use
                        bid values
                      </label>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border rounded">
                        <thead>
                          <tr className="bg-muted">
                            <th className="px-2 py-1 text-left font-semibold">
                              Product Name:
                            </th>
                            <th className="px-2 py-1 text-left font-semibold">
                              Parameters / Units:
                            </th>
                            <th className="px-2 py-1 text-left font-semibold">
                              Bid values:
                            </th>
                            <th className="px-2 py-1 text-left font-semibold">
                              Actions:
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {bidPhases[0].products.map((prod, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="px-2 py-1">{prod.name}</td>
                              <td className="px-2 py-1">{prod.params}</td>
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={prod.value}
                                  placeholder="Enter number..."
                                  className="border-none rounded px-2 py-1 text-sm w-28"
                                  readOnly={!prod.actions}
                                />
                              </td>
                              <td className="px-2 py-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-2 rounded hover:bg-muted focus:outline-none">
                                      <IconDotsVertical className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        navigator.clipboard.writeText(prod.name)
                                      }
                                    >
                                      <IconClipboard className="w-4 h-4 mr-2" />{" "}
                                      Copiar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() =>
                                        alert(`Deletar ${prod.name}`)
                                      }
                                    >
                                      <IconTrash className="w-4 h-4 mr-2" />{" "}
                                      Deletar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Sidebar */}
                <aside className="w-96 flex flex-col gap-6">
                  <Card className="rounded-2xl border border-border bg-background shadow-none p-0">
                    <CardHeader className="pb-0 pt-4 px-4 flex flex-col gap-3 bg-transparent">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-widest mb-1 py-2">
                        <Info className="w-4 h-4" /> GENERAL INFO
                      </div>
                      <div className="flex w-full gap-0 bg-muted rounded-lg overflow-hidden">
                        <button
                          className={`flex-1 text-xs py-2 px-0 rounded-none font-semibold flex items-center justify-center gap-1 border-b-2 transition-all duration-200 ${
                            infoTab === "admin"
                              ? "bg-background text-foreground border-b-2 border-b-foreground shadow-sm"
                              : "bg-transparent text-muted-foreground border-transparent"
                          }`}
                          style={{ borderRadius: "0.5rem 0 0 0.5rem" }}
                          data-active={infoTab === "admin"}
                          onClick={() => setInfoTab("admin")}
                        >
                          <User2 className="w-3 h-3" /> # Admin info
                        </button>
                        <button
                          className={`flex-1 text-xs py-2 px-0 rounded-none font-semibold flex items-center justify-center gap-1 border-b-2 transition-all duration-200 ${
                            infoTab === "customer"
                              ? "bg-background text-foreground border-b-2 border-b-foreground shadow-sm"
                              : "bg-transparent text-muted-foreground border-transparent"
                          }`}
                          style={{ borderRadius: "0 0.5rem 0.5rem 0" }}
                          data-active={infoTab === "customer"}
                          onClick={() => setInfoTab("customer")}
                        >
                          <User2 className="w-3 h-3" /> Customer info
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-0 px-4 bg-background rounded-b-2xl">
                      {infoTab === "customer" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-2 bg-muted p-4 rounded-xl">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground mb-0.5">
                              Customer
                            </span>
                            <span className="font-bold text-foreground">
                              {customerInfo.customer}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground mb-0.5">
                              Customer Contract
                            </span>
                            <span className="text-foreground">
                              {customerInfo.contract}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground mb-0.5">
                              Project Manager
                            </span>
                            <span className="text-foreground">
                              {customerInfo.manager}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground mb-0.5">
                              PM Email
                            </span>
                            <span className="text-foreground">
                              {customerInfo.email}
                            </span>
                          </div>
                          <div className="flex flex-col md:col-span-2">
                            <span className="text-muted-foreground mb-0.5">
                              PM Phone
                            </span>
                            <span className="text-foreground">
                              {customerInfo.phone}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-2 bg-muted p-4 rounded-xl">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground mb-0.5">
                              Admin Name
                            </span>
                            <span className="font-bold text-foreground">
                              John Doe
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground mb-0.5">
                              Admin Email
                            </span>
                            <span className="text-foreground">
                              admin@email.com
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground mb-0.5">
                              Role
                            </span>
                            <span className="text-foreground">
                              Project Admin
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground mb-0.5">
                              Created
                            </span>
                            <span className="text-foreground">01/01/2024</span>
                          </div>
                        </div>
                      )}
                      <button
                        className="flex items-center gap-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground py-3 px-3 rounded-md transition-colors border-none bg-muted mb-4 justify-between min-h-[44px]"
                        onClick={() => alert("Contract Tracker clicked!")}
                      >
                        <span className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" /> Contract Tracker
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="border-b border-border mb-2" />
                      <div className="text-xs font-semibold text-muted-foreground tracking-widest flex items-center gap-2 py-2 mb-2">
                        <StickyNote className="w-4 h-4" /> ATTACHMENTS
                      </div>
                      <button
                        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground py-3 px-3 rounded-md transition-colors border-none bg-muted mb-2 min-h-[44px]"
                        onClick={() => alert("Notes clicked!")}
                      >
                        <span className="flex items-center gap-2">
                          <StickyNote className="w-4 h-4" /> Notes
                        </span>
                        <span className="text-xs text-muted-foreground">
                          (12)
                        </span>
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </button>
                      <button
                        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground py-3 px-3 rounded-md transition-colors border-none bg-muted mb-2 min-h-[44px]"
                        onClick={() => alert("Files clicked!")}
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Files
                        </span>
                        <span className="text-xs text-muted-foreground">
                          (12)
                        </span>
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </button>
                      <button
                        className="flex  items-center justify-between w-full text-sm font-medium bg-muted text-foreground border-none py-3 px-3 rounded-md mb-4 hover:bg-border transition-colors min-h-[44px]"
                        onClick={() => alert("Job Items clicked!")}
                      >
                        <span className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" /> Job Items
                        </span>
                        <span className="text-xs font-semibold bg-background border border-border text-foreground rounded px-2 py-0.5">
                          0608-0001
                        </span>
                        <ChevronDown className="w-4 h-4 ml-1 text-foreground" />
                      </button>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import * as React from "react";
import { Loader } from "lucide-react";
import { Check } from "lucide-react"
import * as Checkbox from "@radix-ui/react-checkbox"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


export default function CustomerViewQuote({ params }: { params: Promise<{ id: string }> }) {
  const [formData, setFormData] = React.useState({
    loadingData: false,
    data: null as any
  });
  const [loadingApi, setLoadingApi] = React.useState<boolean>(false)
  const router = useRouter()

  const toggleLoadingData = () => {
    setFormData((prev) => ({
      ...prev,
      loadingData: !prev.loadingData
    }));
  };

  const fetchQuoteData = async (numericId: number) => {
    toggleLoadingData();
    try {
      const response = await fetch("/api/quotes/" + numericId);
      const result = await response.json();

      if (result) {
        setFormData((prev) => ({ ...prev, data: result }));
      }
    } catch (error) {
      console.log(error);
    } finally {
      toggleLoadingData();
    }
  };

  const checkQuoteItem = (value: boolean, itemId: number) => {
    setFormData((prev: any) => ({
      ...prev,
      data: {
        ...prev.data, items: prev.data.items.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              confirmed: value
            }
          } else {
            return item
          }
        })
      }
    }));
  }

  React.useEffect(() => {
    params.then(({ quoteId }: any) => {
      const numericId = parseInt(quoteId, 10);
      fetchQuoteData(numericId);
    });
  }, [params]);

  if (formData.loadingData || !formData.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin w-10 h-10 text-gray-600" />
      </div>
    );
  }

  const quote = formData.data;

  const selectedItems = quote.items.filter((item: any) => item.confirmed);
  const subtotal = selectedItems.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0
  );
  const totalTax = selectedItems.reduce(
    (acc, item) => acc + ((item.quantity * item.unitPrice) * (item.tax / 100)),
    0
  );

  const total = subtotal + totalTax;

  const handleAcceptQuote = async () => {
    try {
      setLoadingApi(true)

      const res = await fetch("/api/quotes/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData.data
        }),
      });

      const result = await res.json()

      if (result.ok) {
        router.push('/gratitude')
      }

    } catch (error) {
      console.log(error);
    } finally {

      setLoadingApi(false)
    }

  }


  return (
    <div className="w-full h-full px-[100px] py-[20px] bg-gray-50">
      <div className="flex justify-between items-start mb-6">
        <button
          className="text-sm text-gray-600 flex items-center gap-2"
          onClick={() => history.back()}
        >
          ← Back to Admin View
        </button>
        <div className="text-right">
          <h2 className="font-semibold">Your Construction Company</h2>
          <p className="text-sm text-gray-600">
            3162 Unionville Pike , Hatfield, PA 19440
          </p>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">Quote {quote.quote_number}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[50px] p-[20px]">
        <div>
          <h2 className="font-semibold mb-2 text-[20px]">Quote Details</h2>
          <div className="text-sm flex flex-col text-gray-500 space-y-1 mb-6 gap-[12px]">
            <div className="flex  flex-row items-center justify-between">
              <p>Quote Number:</p>
              <p className="font-bold">
                {quote.quote_number}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between">
              <p>Date:</p>
              <p className="font-bold">
                {new Date(quote.quote_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between">
              <p>Valid Until:</p>
              <p className="font-bold">
                -
              </p>
            </div>
            <div className="flex flex-row items-center justify-between">
              <p>Sales Representative:</p>
              <p className="font-bold">
                {quote.etc_point_of_contac ?? "-"}
              </p>
            </div>
          </div>
          <div className="my-[100px]"></div>
          <h2 className="font-semibold mb-2 text-[20px]">Quote Items</h2>
          <table className="w-full text-md">
            <thead className="border-b">
              <tr>
                <th className="p-2 text-left">Description</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Unit Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item: any) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-2 flex flex-col">
                    <p className="font-semibold">{item.description}</p>

                    <p className="text-gray-400">{item.uom}</p>
                  </td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-center">${item.unitPrice.toFixed(2)}</td>
                  <td className="p-2 text-right">
                    <div className="font-bold">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Tax: ${(item.quantity * item.unitPrice * (item.tax / 100)).toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        <div>
          <h2 className="font-semibold mb-4 text-[20px]">Select Items to Accept</h2>
          <div className="space-y-3">
            {quote?.items?.map((item: any) => (
              <div key={item.id} className="flex flex-row items-center p-[20px] gap-3 border border-gray-300 rounded-lg">
                <Checkbox.Root
                  checked={item.confirmed}
                  onCheckedChange={(value: boolean) => checkQuoteItem(value, item.id)}
                  className="h-4 w-4 p-2 rounded border border-gray-400 flex items-center justify-center data-[state=checked]:bg-black"
                >
                  <Checkbox.Indicator>
                    <Check className="h-5 w-5 text-white" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div
                  key={item.id}
                  className="flex  flex-col items-start"
                >
                  <label className="flex items-center gap-2">
                    {item.description}
                  </label>
                  <span className="font-medium">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border rounded-lg p-4 bg-gray-200">
            <h3 className="font-semibold mb-2">Selected Items Total</h3>
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>${totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <h2 className="font-semibold mb-2 mt-[50px] text-[20px]">Comments</h2>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 resize-none"
            placeholder="Add any comments or special requests"
            value={formData.data?.comments || ""}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                data: { ...prev.data, comments: e.target.value },
              }))
            }
          />

          <h2 className="font-semibold mb-2 mt-[50px] text-[20px]">Digital Signature</h2>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 resize-none"
            placeholder="Type your full name to digitally sign this quote"
            value={formData.data?.digital_signature || ""}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                data: { ...prev.data, digital_signature: e.target.value },
              }))
            }
          />
          <p className="mt-1 text-gray-500">By typing your name above, you agree to the terms and conditions of this quote.</p>

          <div className="flex mt-[20px] flex-1 flex-row items-center justify-between gap-2">
            <Button disabled={loadingApi} onClick={handleAcceptQuote} size={'lg'} color="black" variant={'default'} className="flex-1 ">Accept Selected Items</Button>
            <Button size={'lg'} color="white" variant={'outline'} className="flex-1  ">Decline quote</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

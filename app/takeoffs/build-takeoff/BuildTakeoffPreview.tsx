import React from 'react'
import { TakeoffHeader, TakeoffItem } from '@/types/Takeoff'

interface BuildTakeoffPreviewProps {
  header: TakeoffHeader
  items: TakeoffItem[]
}

export default function BuildTakeoffPreview({ header, items }: BuildTakeoffPreviewProps) {
  return (
    <div className="bg-white min-h-[100vh] flex flex-col text-black font-sans text-[12px]">
      <div className="flex-1">
        {/* Header */}
        <div className="text-center py-4 border-b">
          <h1 className="text-2xl font-bold">Takeoff Sheet</h1>
        </div>

        {/* Project Information */}
        <div className="mt-4 p-4">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Project Information</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="mb-2">
                <span className="font-semibold">ETC Job #:</span> {header.etcJobNumber || '-'}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Work Type:</span> {header.workType || '-'}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Customer:</span> {header.customer?.displayName || header.customer?.name || '-'}
              </div>
            </div>
            <div>
              <div className="mb-2">
                <span className="font-semibold">Customer Job #:</span> {header.customerJobNumber || '-'}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Contract #:</span> {header.contractNumber || '-'}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Customer POC:</span> {header.customerPOC || '-'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div>
              <span className="font-semibold">POC Email:</span> {header.customerPOCEmail || '-'}
            </div>
            <div>
              <span className="font-semibold">POC Phone:</span> {header.customerPOCPhone || '-'}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-6 p-4">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Items</h2>

          <table className="w-full border border-gray-400 border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Item #</th>
                <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Description</th>
                <th className="border border-gray-400 px-2 py-2 text-center font-semibold">Quantity</th>
                <th className="border border-gray-400 px-2 py-2 text-center font-semibold">UOM</th>
                <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-gray-400 px-2 py-4 text-center text-gray-500">
                    No items added yet
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-400 px-2 py-2">{item.itemNumber || '-'}</td>
                    <td className="border border-gray-400 px-2 py-2">{item.description || '-'}</td>
                    <td className="border border-gray-400 px-2 py-2 text-center">{item.quantity || 0}</td>
                    <td className="border border-gray-400 px-2 py-2 text-center">{item.uom || '-'}</td>
                    <td className="border border-gray-400 px-2 py-2">{item.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t text-center text-xs text-gray-600">
        <p>Takeoff generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}
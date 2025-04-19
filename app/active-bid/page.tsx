"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useRouter } from "next/navigation"

const steps = [
  {
    id: 'step-1',
    name: 'Admin Information',
    description: 'Basic information about the bid',
    fields: [
      { name: 'contractNumber', label: 'Contract Number*', type: 'text', placeholder: 'Contract Number' },
      { name: 'estimator', label: 'Estimator*', type: 'select', placeholder: 'Ses Brunton' },
      { name: 'owner', label: 'Owner*', type: 'select', placeholder: 'Choose' },
      { name: 'county', label: 'County*', type: 'select', placeholder: 'Choose County' },
      { name: 'township', label: 'Township*', type: 'text', placeholder: 'Township' },
      { name: 'division', label: 'Division*', type: 'select', placeholder: 'Choose' },
      { name: 'lettingDate', label: 'Letting Date*', type: 'date', placeholder: 'Select date' },
      { name: 'startDate', label: 'Start Date*', type: 'date', placeholder: 'Select date' },
      { name: 'endDate', label: 'End Date*', type: 'date', placeholder: 'Select date' },
      { name: 'srRoute', label: 'SR Route*', type: 'text', placeholder: 'SR Route' },
      { name: 'dbePercentage', label: 'DBE %*', type: 'text', placeholder: 'DBE %' },
      { name: 'workType', label: 'Work Type', type: 'select', placeholder: 'Rated' },
      { name: 'oneWayTravelTime', label: 'One Way Travel Time (Mins)*', type: 'number', placeholder: 'One Way Travel Time (Mins)' },
      { name: 'oneWayMileage', label: 'One Way Mileage*', type: 'number', placeholder: 'One Way Mileage' },
      { name: 'dieselCost', label: 'Diesel Cost Per Gallon*', type: 'number', placeholder: 'Diesel Cost Per Gallon' },
      { name: 'laborRate', label: 'Labor Rate*', type: 'number', placeholder: '0', hasToggle: true },
      { name: 'fringeRate', label: 'Fringe Rate*', type: 'number', placeholder: '0', hasToggle: true },
      { name: 'shopRate', label: 'Shop Rate*', type: 'number', placeholder: '0', hasToggle: true },
      { name: 'winterShutdown', label: 'Winter Shutdown', type: 'toggle' }
    ]
  },
  {
    id: 'step-2',
    name: 'Bid Items',
    description: 'Add and manage bid items',
    fields: [
      { name: 'items', label: 'Items', type: 'table' }
    ]
  },
  {
    id: 'step-3',
    name: 'Bid Summary',
    description: 'Review bid details',
    fields: [
      { name: 'summary', label: 'Summary', type: 'summary' }
    ]
  }
]

interface FormData {
  contractNumber?: string;
  owner?: string;
  county?: string;
  branch?: string;
  township?: string;
  division?: string;
  startDate?: string;
  endDate?: string;
  lettingDate?: string;
  srRoute?: string;
  dbePercentage?: string;
  [key: string]: string | undefined;
}

export default function ActiveBidPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [toggleStates, setToggleStates] = useState({
    laborRate: false,
    fringeRate: false,
    shopRate: false,
    winterShutdown: false
  })
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleToggleChange = (field: string) => {
    setToggleStates(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    console.log('Form submitted:', formData)
    router.push('/jobs/active-bids')
  }

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
        <div className="flex flex-1 flex-col -mt-8">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-6">
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    className="gap-2 -ml-2 mb-4"
                    onClick={() => router.push('/jobs/active-bids')}
                  >
                    ← Back to Bid List
                  </Button>
                  <h1 className="text-3xl font-bold">Create New Bid</h1>
                </div>

                {/* Vertical Steps with Collapsible Content */}
                <div className="flex gap-8">
                  <div className="flex-1">
                    <div className="relative flex flex-col">
                      <div className="absolute left-4 top-[40px] bottom-8 w-[2px] bg-border" />
                      
                      {steps.map((step, index) => (
                        <div key={step.id} className="relative">
                          <button
                            onClick={() => setCurrentStep(index)}
                            className={`group flex w-full items-start gap-4 py-4 text-left ${
                              currentStep === index ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            <div
                              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                                index <= currentStep
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground bg-background'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="text-base font-medium">{step.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {step.description}
                              </div>
                            </div>
                          </button>

                          {/* Collapsible Content */}
                          {currentStep === index && (
                            <div className="mt-2 mb-6 ml-12 text-sm text-muted-foreground">
                              {index === 0 && (
                                <div className="space-y-8">
                                  <div className="max-w-xl grid grid-cols-2 gap-6">
                                    {steps[0].fields.map((field) => (
                                      <div key={field.name} className="space-y-2.5">
                                        <Label
                                          htmlFor={field.name}
                                          className="text-sm font-medium text-muted-foreground"
                                        >
                                          {field.label}
                                        </Label>
                                        {field.type === 'select' ? (
                                          <select
                                            id={field.name}
                                            value={formData[field.name] || ''}
                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            <option value="">{field.placeholder}</option>
                                          </select>
                                        ) : field.type === 'toggle' ? (
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              id={field.name}
                                              checked={toggleStates[field.name]}
                                              onChange={() => handleToggleChange(field.name)}
                                              className="h-4 w-4"
                                            />
                                            <Label htmlFor={field.name}>{field.label}</Label>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <Input
                                              id={field.name}
                                              type={field.type}
                                              placeholder={field.placeholder}
                                              value={formData[field.name] || ''}
                                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                                              className="h-10"
                                            />
                                            {field.hasToggle && (
                                              <div className="flex items-center gap-2">
                                                <Label htmlFor={`${field.name}-toggle`} className="text-sm text-muted-foreground">
                                                  Use this rate?
                                                </Label>
                                                <input
                                                  id={`${field.name}-toggle`}
                                                  type="checkbox"
                                                  checked={toggleStates[field.name]}
                                                  onChange={() => handleToggleChange(field.name)}
                                                  className="h-4 w-4"
                                                />
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex justify-end">
                                    <Button onClick={handleNext}>Next</Button>
                                  </div>
                                </div>
                              )}

                              {index === 1 && (
                                <div className="max-w-xl space-y-6">
                                  <p>Add and manage bid items</p>
                                  <div className="flex justify-between">
                                    <Button 
                                      variant="outline"
                                      onClick={() => setCurrentStep(0)}
                                    >
                                      Back
                                    </Button>
                                    <Button onClick={handleNext}>Next</Button>
                                  </div>
                                </div>
                              )}

                              {index === 2 && (
                                <div className="max-w-xl space-y-6">
                                  <p>Bid summary information will be displayed here</p>
                                  <div className="flex justify-between">
                                    <Button 
                                      variant="outline"
                                      onClick={() => setCurrentStep(1)}
                                    >
                                      Back
                                    </Button>
                                    <Button onClick={handleSubmit}>Create</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview Cards */}
                  <div className="w-80 space-y-4">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Admin Information</h3>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Contract #</div>
                        <div className="text-right">{formData.contractNumber || '-'}</div>
                        <div className="text-muted-foreground">Owner</div>
                        <div className="text-right">{formData.owner || '-'}</div>
                        <div className="text-muted-foreground">County</div>
                        <div className="text-right">{formData.county || '-'}</div>
                        <div className="text-muted-foreground">Branch</div>
                        <div className="text-right">{formData.branch || '-'}</div>
                        <div className="text-muted-foreground">Township</div>
                        <div className="text-right">{formData.township || '-'}</div>
                        <div className="text-muted-foreground">Division</div>
                        <div className="text-right">{formData.division || '-'}</div>
                        <div className="text-muted-foreground">Start Date</div>
                        <div className="text-right">{formData.startDate || '-'}</div>
                        <div className="text-muted-foreground">End Date</div>
                        <div className="text-right">{formData.endDate || '-'}</div>
                        <div className="text-muted-foreground">Total Days</div>
                        <div className="text-right">0</div>
                        <div className="text-muted-foreground">Bid Date</div>
                        <div className="text-right">{formData.lettingDate || '-'}</div>
                        <div className="text-muted-foreground">SR Route</div>
                        <div className="text-right">{formData.srRoute || '-'}</div>
                        <div className="text-muted-foreground">DBE %</div>
                        <div className="text-right">{formData.dbePercentage || '%'}</div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Bid Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Revenue:</span>
                          <span>$0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span>$0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross Profit:</span>
                          <span>$0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross Margin:</span>
                          <span>0.00%</span>
                        </div>
                        <Button className="w-full mt-4" variant="secondary">
                          View Bid Summary
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 
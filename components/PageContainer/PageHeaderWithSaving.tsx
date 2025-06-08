import { Button } from '../../components/ui/button'
import { XIcon } from 'lucide-react'
import React, { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { Badge, badgeVariants } from '../ui/badge';

interface Props {
    heading: string;
    subheading?: string;
    handleSubmit: () => void
    showX?: boolean
    badgeText?: string
    saveButtons?: ReactNode
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'successful' | 'warning' | 'purple' | 'outline'
}

const PageHeaderWithSaving = ({ heading, subheading, handleSubmit, showX, badgeText, badgeVariant, saveButtons }: Props) => {

    return (
        <div className={`flex w-full bg-white z-50 items-center sticky top-0 justify-between px-6 gap-2 pb-4 mb-6 ${showX ? 'mt-2 pt-6 border-b-1' : ''}`}>
            <div className='flex items-center gap-x-0'>
                {showX && <Button variant='ghost' onClick={handleSubmit}>
                    <XIcon className="cursor-pointer" />
                </Button>}
                {showX && <Separator className='max-w-8 rotate-90 -ml-2 -mr-1' />}
                <div>
                    <h1 className="text-3xl whitespace-nowrap font-bold">
                        {heading}
                    </h1>
                    {subheading && subheading.trim() !== '' && <p className="text-muted-foreground whitespace-nowrap">{subheading}</p>}
                </div>
                {badgeText && badgeVariant && <Badge variant={badgeVariant}
                    className={`ml-2 mt-1 text-sm ${badgeVariant === 'warning' ? 'text-black' : ''}`}>{badgeText}</Badge>}
            </div>
            {saveButtons}
        </div>
    )
}

export default PageHeaderWithSaving
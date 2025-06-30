import React from 'react'

interface Props {
    topText: string
    subtext: string
}

const EmptyContainer = ({ topText, subtext }: Props) => {
    return (
        <div className='w-full'>
            <div className='w-full flex flex-col py-10 my-4 rounded-lg border-2 justify-center items-center border-dashed border-text-primary'>
                <div>{topText}</div>
                <div>{subtext}</div>
            </div>
        </div>
    )
}

export default EmptyContainer

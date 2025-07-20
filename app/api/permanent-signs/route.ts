import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(){
    
    const {data : productivityData, error : productivityError} = await supabase.from('productivity_rates').select('*').single();

    if(productivityError){
        console.error(productivityError)
        return NextResponse.json({status: 500, message: productivityError})
    }

    const {data : itemData, error : itemError} = await supabase.from('items').select('name, price');
    if(itemError){
        console.error(itemError)
        return NextResponse.json({status: 500, message: itemError})
    }

    const {data: itemMarkup, error: markupError} = await supabase.from('general_static_assumptions').select('material_markup').single();

    if(markupError){
        console.error(markupError)
        return NextResponse.json({status: 500, message: markupError})
    }

    return NextResponse.json({status: 200, data: {...productivityData, items: itemData, ...itemMarkup}})
}
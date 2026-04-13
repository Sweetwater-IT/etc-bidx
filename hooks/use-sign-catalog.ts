import useSWR, { mutate as globalMutate } from 'swr';
import { createClient } from '@supabase/supabase-js';
import {
  KitVariant,
  PataKit,
  PtsKit,
  SignDesignation,
  SignsApiResponse,
} from '@/types/MPTEquipment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SIGN_CATALOG_KEY = 'sign-catalog';

const mapDimensions = (sizes: string[] = []) =>
  sizes
    .map((sizeStr) => {
      const [widthStr, heightStr] = sizeStr.split(' x ');
      const width = parseFloat(widthStr);
      const height = parseFloat(heightStr);
      return !Number.isNaN(width) && !Number.isNaN(height)
        ? { width, height }
        : null;
    })
    .filter((dim): dim is { width: number; height: number } => dim !== null);

const buildVariantMap = (variantsData: any[] = []) => {
  const variantMap = new Map<number, KitVariant[]>();

  variantsData.forEach((variant) => {
    const existing = variantMap.get(Number(variant.kit_id)) || [];
    existing.push({
      id: Number(variant.id),
      kit_id: Number(variant.kit_id),
      label: variant.variant_label,
      description: variant.description || undefined,
      finished: variant.finished || false,
      blights: variant.blights || 0,
      bLights: variant.blights || 0,
      created_at: variant.created_at || undefined,
    });
    variantMap.set(Number(variant.kit_id), existing);
  });

  return variantMap;
};

async function fetchSignCatalog(): Promise<SignsApiResponse> {
  const { data: signsDataRaw, error: signsError } = await supabase
    .from('signs_all')
    .select('id, designation, description, category, sizes, sheeting, image_url')
    .order('designation');

  if (signsError) {
    throw new Error(`Failed to fetch MUTCD signs: ${signsError.message}`);
  }

  const signs: SignDesignation[] = (signsDataRaw || []).map((sign: any) => {
    const dimensions = mapDimensions(sign.sizes || []);

    return {
      ...sign,
      dimensions: dimensions.length > 0 ? dimensions : [{ width: 0, height: 0 }],
    };
  });

  const { data: pataKitsData, error: pataKitsError } = await supabase
    .from('pata_kits')
    .select('id, code, description, image_url, finished, reviewed, has_variants')
    .order('code');

  if (pataKitsError) {
    throw new Error(`Failed to fetch PATA kits: ${pataKitsError.message}`);
  }

  const { data: ptsKitsData, error: ptsKitsError } = await supabase
    .from('pts_kits')
    .select('id, code, description, image_url, finished, reviewed, has_variants')
    .order('code');

  if (ptsKitsError) {
    throw new Error(`Failed to fetch PTS kits: ${ptsKitsError.message}`);
  }

  const { data: variantsData, error: variantsError } = await supabase
    .from('kit_variants')
    .select('id, kit_id, variant_label, description, finished, blights, created_at');

  if (variantsError) {
    throw new Error(`Failed to fetch kit variants: ${variantsError.message}`);
  }

  const variantsMap = buildVariantMap(variantsData || []);

  const pataKits: PataKit[] = await Promise.all(
    (pataKitsData || []).map(async (kit) => {
      const { data: contents, error: contentsError } = await supabase
        .from('pata_kit_contents')
        .select('sign_designation, quantity, blight_quantity, kit_variant_id')
        .eq('pata_kit_code', kit.code);

      if (contentsError) {
        throw new Error(
          `Failed to fetch PATA kit contents for ${kit.code}: ${contentsError.message}`
        );
      }

      return {
        ...kit,
        contents: contents || [],
        signCount: contents?.length || 0,
        variants: variantsMap.get(Number(kit.id)) || [],
        selectedVariant: null,
      };
    })
  );

  const ptsKits: PtsKit[] = await Promise.all(
    (ptsKitsData || []).map(async (kit) => {
      const { data: contents, error: contentsError } = await supabase
        .from('pts_kit_contents')
        .select('sign_designation, quantity, kit_variant_id')
        .eq('pts_kit_code', kit.code);

      if (contentsError) {
        throw new Error(
          `Failed to fetch PTS kit contents for ${kit.code}: ${contentsError.message}`
        );
      }

      return {
        ...kit,
        contents: contents || [],
        signCount: contents?.length || 0,
        variants: variantsMap.get(Number(kit.id)) || [],
        selectedVariant: null,
      };
    })
  );

  return {
    signs,
    pataKits,
    ptsKits,
  };
}

export function useSignCatalog() {
  const { data, error, isLoading, mutate } = useSWR(
    SIGN_CATALOG_KEY,
    fetchSignCatalog,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 1000 * 60 * 60,
      errorRetryCount: 2,
    }
  );

  return {
    catalog: data,
    isLoading,
    error: error ? (error as Error).message : null,
    mutate,
  };
}

export async function prefetchSignCatalog() {
  return globalMutate(SIGN_CATALOG_KEY, fetchSignCatalog(), {
    populateCache: true,
    revalidate: false,
  });
}

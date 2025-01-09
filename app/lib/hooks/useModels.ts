import { useLoaderData } from '@remix-run/react';
import type { ModelInfo } from '~/lib/modules/llm/types';

export function useModels() {
  const { modelList } = useLoaderData<{ modelList: ModelInfo[] }>();
  return modelList;
}

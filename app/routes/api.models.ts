import { MODEL_LIST } from '~/utils/constants';

export async function loader() {
  return Response.json(MODEL_LIST);
}

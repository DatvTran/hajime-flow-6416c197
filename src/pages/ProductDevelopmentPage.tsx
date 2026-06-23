import { useNewProductRequests } from "@/contexts/AppDataContext";
import { HqProductDevelopmentView } from "@/components/hq/HqProductDevelopmentView";

export default function ProductDevelopmentPage() {
  const { newProductRequests, patchNewProductRequest } = useNewProductRequests();

  return (
    <HqProductDevelopmentView
      newProductRequests={newProductRequests}
      patchNewProductRequest={patchNewProductRequest}
    />
  );
}

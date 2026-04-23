import { ProductStatus } from "@/schemas/product.schema";

export function StatusBadge({ status }: { status: ProductStatus }) {
  const config = {
    SELLING: {
      label: "판매중",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    SOLD_OUT: {
      label: "품절",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
    INACTIVE: {
      label: "비활성화",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };
  const { label, className } = config[status] || config.SOLD_OUT;

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold border rounded-full ${className}`}
    >
      {label}
    </span>
  );
}

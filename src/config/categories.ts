import {
  BabyIcon,
  CarrotIcon,
  CupSodaIcon,
  MilkIcon,
  PopcornIcon,
  SoapDispenserDropletIcon,
  SprayCanIcon,
  WheatIcon,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  label: string;
  query: string;
  icon: LucideIcon;
}

export const categories: Category[] = [
  { label: "Dairy & Eggs", query: "milk", icon: MilkIcon },
  { label: "Fruits & Vegetables", query: "fresh vegetables", icon: CarrotIcon },
  { label: "Atta, Rice & Dal", query: "atta", icon: WheatIcon },
  { label: "Snacks", query: "chips", icon: PopcornIcon },
  { label: "Beverages", query: "cold drink", icon: CupSodaIcon },
  { label: "Personal Care", query: "shampoo", icon: SoapDispenserDropletIcon },
  { label: "Home Cleaning", query: "detergent", icon: SprayCanIcon },
  { label: "Baby Care", query: "diapers", icon: BabyIcon },
];

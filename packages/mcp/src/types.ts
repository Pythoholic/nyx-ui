export interface NyxInitializer {
  import: string;
  function: string;
  selector: string;
}

export interface NyxAccessibilityContract {
  requirements: string[];
}

export interface NyxRegistryItem {
  name: string;
  type: string;
  status: string;
  description?: string;
  useWhen?: string[];
  avoidWhen?: string[];
  files: string[];
  requires: string[];
  initializer?: NyxInitializer;
  accessibility?: NyxAccessibilityContract;
  related?: string[];
}

export interface NyxRegistry {
  name: string;
  version: string;
  description: string;
  items: NyxRegistryItem[];
}

export interface NyxComponentSource {
  path: string;
  content: string;
}

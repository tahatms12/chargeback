export interface AppData {
  name: string;
  slug: string;
  positioning: string;
  problem: string;
  user: string;
  features: string[];
  howItWorks: string;
  setupRequirements: string;
  limitations: string;
  supportThemes: string;
  dataHandling: string;
  installPrereqs: string;
  onlineStoreRequired: boolean;
  appStoreSafe: string;
  websiteSafe: string;
  hasBilling: boolean;
  hasTrackingCookies: boolean;
  usesProtectedCustomerData: boolean;
}

export const appsData: Record<string, AppData> = {
  "craftline": {
    name: "Craftline",
    slug: "craftline",
    positioning: "Order synchronization and maker queue automation.",
    problem: "Tracking production status of customized orders across multiple makers requires constant manual syncing.",
    user: "Make-to-order merchants",
    features: ["Automated production queues", "Order state synchronization"],
    howItWorks: "Syncs Shopify orders into customizable production queues automatically based on product tags.",
    setupRequirements: "Configure tags for makers.",
    limitations: "Does not support raw material inventory tracking.",
    supportThemes: "Setup configuration, queue rule troubleshooting.",
    dataHandling: "Reads order line items; standard retention.",
    installPrereqs: "None",
    onlineStoreRequired: false,
    appStoreSafe: "Automate production queues for make-to-order operations.",
    websiteSafe: "Craftline connects your Shopify orders directly to maker workstations. Define rules once and let products route themselves to fulfillment queues automatically without spreadsheets.",
    hasBilling: false,
    hasTrackingCookies: false,
    usesProtectedCustomerData: false
  },
  "fixitcsv": {
    name: "FixitCSV",
    slug: "fixitcsv",
    positioning: "Robust, validated CSV data imports.",
    problem: "Formatting errors in bulk CSV uploads cause silent failures or corrupted catalog data.",
    user: "Store operators and catalog managers",
    features: ["Safe CSV parsing", "Pre-import validation", "Syntax error highlighting"],
    howItWorks: "Upload your exact CSV locally, FixitCSV validates the formatting constraints before hitting Shopify APIs, then injects the clean data.",
    setupRequirements: "None",
    limitations: "File sizes up to 10MB per upload.",
    supportThemes: "CSV formatting rules, error deciphering.",
    dataHandling: "Processes files in memory; files are not retained post-import.",
    installPrereqs: "None",
    onlineStoreRequired: false,
    appStoreSafe: "Import catalog and bulk data safely via validated CSV.",
    websiteSafe: "Stop guessing why your catalog imports failed. FixitCSV provides safe, validated CSV parsing with exact error highlighting before your data hits Shopify APIs.",
    hasBilling: false,
    hasTrackingCookies: false,
    usesProtectedCustomerData: false
  },
  "stagewise": {
    name: "Stagewise",
    slug: "stagewise",
    positioning: "Incremental staging for complex fulfillment operations.",
    problem: "Large or complex orders cannot always be fulfilled simultaneously.",
    user: "Merchants with staged fulfillment or multi-warehouse logistics",
    features: ["Staged fulfillment management", "Progressive order statuses"],
    howItWorks: "Hooks into the order lifecycle to mark progressive states of a multi-stage fulfillment cycle.",
    setupRequirements: "Map active fulfillment locations.",
    limitations: "Does not replace third-party logistics integrations.",
    supportThemes: "Location mismatch, webhook synchronization delays.",
    dataHandling: "Processes order IDs and fulfillment statuses.",
    installPrereqs: "None",
    onlineStoreRequired: false,
    appStoreSafe: "Manage multi-stage order fulfillment workflows.",
    websiteSafe: "Stagewise lets your team break large or complex orders into incremental fulfillment steps without confusing customer notifications.",
    hasBilling: false,
    hasTrackingCookies: false,
    usesProtectedCustomerData: false
  },
  "customsready": {
    name: "Customs Ready",
    slug: "customsready",
    positioning: "Dynamic customs documentation preparation for international orders.",
    problem: "Generating accurate customs declarations for international shipments is a high-liability manual task.",
    user: "High-volume international shippers",
    features: ["Forms generation", "Order admin integration", "Product classification sync"],
    howItWorks: "Reads international orders, matches product weights and HS codes, and prints localized customs declarations directly from the Shopify Admin order view.",
    setupRequirements: "Input baseline HS codes for catalog.",
    limitations: "Carrier-specific requirements may still need manual tuning depending on integration level.",
    supportThemes: "Label generation failures, missing HS codes.",
    dataHandling: "Reads customer shipping addresses (Protected Customer Data required for labels). Retains logs strictly for 30-day debug cycles.",
    installPrereqs: "None",
    onlineStoreRequired: false,
    appStoreSafe: "Generate and print localized customs documentation directly from the order page.",
    websiteSafe: "Stop hand-typing international shipping documentation. CustomsReady automatically aligns your catalog HS codes with international orders so your fulfillment team can print completed declarations instantly.",
    hasBilling: true,
    hasTrackingCookies: true,
    usesProtectedCustomerData: true
  },
  "poref": {
    name: "PORef",
    slug: "poref",
    positioning: "Seamless Purchase Order reference tracking across checkout and POS.",
    problem: "B2B customers often need to provide their internal PO references at the moment of checkout, but standard Shopify flows lack a unified PO capture mechanism.",
    user: "B2B and blended merchants",
    features: ["Checkout Extension block", "POS Extension integration", "Admin order visibility"],
    howItWorks: "Injects a PO capture field at checkout and POS, saving the reference to order attributes seamlessly.",
    setupRequirements: "Enable Checkout/POS extensions in settings.",
    limitations: "Only viable for Shopify plans containing Checkout Extensibility or newer.",
    supportThemes: "Checkout block placement, theme integration.",
    dataHandling: "Reads orders. Attaches new metadata to orders.",
    installPrereqs: "Checkout Extensibility enabled.",
    onlineStoreRequired: true,
    appStoreSafe: "Capture customer Purchase Order numbers smoothly during Checkout and POS flows.",
    websiteSafe: "Empower your B2B buyers. PORef naturally injects Purchase Order capture straight into your Shopify Checkout and POS experiences, ensuring invoice reconciliation is flawless.",
    hasBilling: false,
    hasTrackingCookies: false,
    usesProtectedCustomerData: true
  },
  "quoteloop": {
    name: "QuoteLoop",
    slug: "quoteloop",
    positioning: "Automated draft order synchronization and quote messaging.",
    problem: "Following up manually on Draft Orders/Quotes slows down B2B sales cycles.",
    user: "Wholesale businesses drafting custom orders",
    features: ["Draft order parsing", "Quote notifications", "Automated email synchronization"],
    howItWorks: "Watches for drafted orders and synchronizes quote notifications automatically via external email connections.",
    setupRequirements: "Connect designated sender email profiles.",
    limitations: "Requires external email provider setup.",
    supportThemes: "Draft order status misreads, email delivery bouncing.",
    dataHandling: "Reads customer email strings (Protected Data).",
    installPrereqs: "None",
    onlineStoreRequired: false,
    appStoreSafe: "Synchronize and send quote notifications from drafted orders seamlessly.",
    websiteSafe: "Accelerate your wholesale pipeline. Quando you create a draft order, QuoteLoop automatically parses the contents and structures an outbound quote notification.",
    hasBilling: false,
    hasTrackingCookies: false,
    usesProtectedCustomerData: true
  }
};

export function getAppData(slug: string): AppData | undefined {
  return appsData[slug];
}

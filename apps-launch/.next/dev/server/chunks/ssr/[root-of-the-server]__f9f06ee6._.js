module.exports = [
"[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/favicon.ico.mjs { IMAGE => \"[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/favicon.ico.mjs { IMAGE => \"[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/lib/data.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appsData",
    ()=>appsData,
    "getAppData",
    ()=>getAppData
]);
const appsData = {
    "craftline": {
        name: "Craftline",
        slug: "craftline",
        positioning: "Order synchronization and maker queue automation.",
        problem: "Tracking production status of customized orders across multiple makers requires constant manual syncing.",
        user: "Make-to-order merchants",
        features: [
            "Automated production queues",
            "Order state synchronization"
        ],
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
        features: [
            "Safe CSV parsing",
            "Pre-import validation",
            "Syntax error highlighting"
        ],
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
        features: [
            "Staged fulfillment management",
            "Progressive order statuses"
        ],
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
        features: [
            "Forms generation",
            "Order admin integration",
            "Product classification sync"
        ],
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
        features: [
            "Checkout Extension block",
            "POS Extension integration",
            "Admin order visibility"
        ],
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
        features: [
            "Draft order parsing",
            "Quote notifications",
            "Automated email synchronization"
        ],
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
function getAppData(slug) {
    return appsData[slug];
}
}),
"[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MockupPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/shopifyapps/final/chargeback/apps-launch/node_modules/.pnpm/next@16.1.6_@babel+core@7.29.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$src$2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/lib/data.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Downloads/shopifyapps/final/chargeback/apps-launch/node_modules/.pnpm/next@16.1.6_@babel+core@7.29.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/shopifyapps/final/chargeback/apps-launch/node_modules/.pnpm/next@16.1.6_@babel+core@7.29.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
;
;
;
async function MockupPage({ params }) {
    const { slug } = await params;
    const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$src$2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAppData"])(slug);
    if (!app) (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-[#f1f2f4] font-sans p-8 flex items-center justify-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-[1024px] h-[768px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-14 bg-[#1a1c1d] flex items-center px-4 justify-between shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-8 h-8 rounded bg-[#303233] flex items-center justify-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-4 h-4 bg-[#008060] rounded-sm"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                        lineNumber: 19,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                    lineNumber: 18,
                                    columnNumber: 14
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-white text-sm font-medium",
                                    children: "Uplift Dev Store"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                    lineNumber: 21,
                                    columnNumber: 14
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                            lineNumber: 17,
                            columnNumber: 12
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-[#303233] text-gray-300 text-xs px-4 py-1.5 rounded-md w-64 text-center",
                            children: "Search"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                            lineNumber: 23,
                            columnNumber: 12
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold",
                            children: "JD"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                            lineNumber: 26,
                            columnNumber: 12
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                    lineNumber: 16,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-1 overflow-hidden",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-60 bg-[#f1f2f4] border-r border-gray-200 p-4 flex flex-col gap-2 shrink-0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm font-medium text-gray-800 p-2 rounded hover:bg-gray-200",
                                    children: "Home"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                    lineNumber: 36,
                                    columnNumber: 14
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm font-medium text-gray-800 p-2 rounded hover:bg-gray-200",
                                    children: "Orders"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                    lineNumber: 37,
                                    columnNumber: 14
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm font-medium text-gray-800 p-2 rounded hover:bg-gray-200",
                                    children: "Products"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                    lineNumber: 38,
                                    columnNumber: 14
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm font-medium text-gray-800 p-2 rounded hover:bg-gray-200",
                                    children: "Customers"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                    lineNumber: 39,
                                    columnNumber: 14
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-8 text-xs font-bold text-gray-500 uppercase px-2 mb-2",
                                    children: "Apps"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                    lineNumber: 40,
                                    columnNumber: 14
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm font-bold text-[#008060] bg-[#e3f1ed] p-2 rounded",
                                    children: app.name
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                    lineNumber: 41,
                                    columnNumber: 14
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 bg-white p-8 overflow-y-auto",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "max-w-3xl mx-auto",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between items-end mb-8",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                        className: "text-2xl font-bold text-gray-900 mb-2",
                                                        children: [
                                                            app.name,
                                                            " Dashboard"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                        lineNumber: 49,
                                                        columnNumber: 20
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-gray-500",
                                                        children: app.positioning
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                        lineNumber: 50,
                                                        columnNumber: 20
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                lineNumber: 48,
                                                columnNumber: 18
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "bg-[#008060] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#006e52]",
                                                children: "Settings"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                lineNumber: 52,
                                                columnNumber: 18
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                        lineNumber: 47,
                                        columnNumber: 16
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-2 gap-6 mb-8",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "border border-gray-200 rounded-xl p-6 bg-white shadow-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-gray-500 font-medium mb-1",
                                                        children: "Active Syncs"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                        lineNumber: 59,
                                                        columnNumber: 20
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-3xl font-bold text-gray-900",
                                                        children: "24"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                        lineNumber: 60,
                                                        columnNumber: 20
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                lineNumber: 58,
                                                columnNumber: 18
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "border border-gray-200 rounded-xl p-6 bg-white shadow-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-gray-500 font-medium mb-1",
                                                        children: "Status"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                        lineNumber: 63,
                                                        columnNumber: 20
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-lg font-bold text-green-600 flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-2.5 h-2.5 rounded-full bg-green-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                lineNumber: 65,
                                                                columnNumber: 22
                                                            }, this),
                                                            " Connected"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                        lineNumber: 64,
                                                        columnNumber: 20
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                lineNumber: 62,
                                                columnNumber: 18
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                        lineNumber: 57,
                                        columnNumber: 16
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "border-b border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        className: "font-semibold text-gray-900",
                                                        children: "Recent Activity"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                        lineNumber: 72,
                                                        columnNumber: 20
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-500 cursor-pointer",
                                                        children: "View all"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                        lineNumber: 73,
                                                        columnNumber: 20
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                lineNumber: 71,
                                                columnNumber: 18
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "p-0",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                    className: "w-full text-left text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                            className: "border-b border-gray-100 text-gray-500",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 font-medium",
                                                                        children: "Event"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                        lineNumber: 79,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 font-medium",
                                                                        children: "Status"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                        lineNumber: 80,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 font-medium text-right",
                                                                        children: "Time"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                        lineNumber: 81,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                lineNumber: 78,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                            lineNumber: 77,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                            className: "divide-y divide-gray-100",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 text-gray-900",
                                                                            children: app.features[0] || 'System Event'
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 86,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold",
                                                                                children: "Success"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                                lineNumber: 87,
                                                                                columnNumber: 53
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 87,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 text-gray-500 text-right",
                                                                            children: "Just now"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 88,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                    lineNumber: 85,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 text-gray-900",
                                                                            children: "Health Check"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 91,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold",
                                                                                children: "Success"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                                lineNumber: 92,
                                                                                columnNumber: 53
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 92,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 text-gray-500 text-right",
                                                                            children: "2 mins ago"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 93,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                    lineNumber: 90,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 text-gray-900",
                                                                            children: "Data Synchronization"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 96,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold",
                                                                                children: "Success"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                                lineNumber: 97,
                                                                                columnNumber: 53
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 97,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$shopifyapps$2f$final$2f$chargeback$2f$apps$2d$launch$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 text-gray-500 text-right",
                                                                            children: "1 hr ago"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                            lineNumber: 98,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                                    lineNumber: 95,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                            lineNumber: 84,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                    lineNumber: 76,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                                lineNumber: 75,
                                                columnNumber: 18
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                        lineNumber: 70,
                                        columnNumber: 16
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                                lineNumber: 46,
                                columnNumber: 14
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
            lineNumber: 13,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
}),
"[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Downloads/shopifyapps/final/chargeback/apps-launch/src/app/mockups/[slug]/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f9f06ee6._.js.map
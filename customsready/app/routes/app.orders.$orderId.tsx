import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import { fetchAndMapOrder } from "~/lib/orderMapper";
import { useState, useEffect } from "react";
import type { LineItemCustoms } from "~/types/customs";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const orderId = params.orderId;
  
  if (!orderId) {
    throw new Response("Missing order ID", { status: 400 });
  }

  const invoiceData = await fetchAndMapOrder(admin, orderId);
  return json({ orderId, invoiceData });
}

export default function OrderDetails() {
  const { orderId, invoiceData } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();
  const emailFetcher = useFetcher<any>();
  const invoiceFetcher = useFetcher<any>();
  const cnFetcher = useFetcher<any>();
  const aiFetcher = useFetcher<any>();
  const navigate = useNavigate();

  // Local state for editable items
  const [lineItems, setLineItems] = useState<LineItemCustoms[]>(invoiceData.lineItems);
  const [buyerDetails, setBuyerDetails] = useState(invoiceData.buyerDetails);
  
  const [activeAiRowIndex, setActiveAiRowIndex] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [autoAiTriggered, setAutoAiTriggered] = useState(false);

  // Recalculate total value based on edits
  const totalValue = lineItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  
  const currentInvoiceData = {
    ...invoiceData,
    buyerDetails,
    lineItems,
    totalDeclaredValue: totalValue
  };

  const calculateDuties = () => {
    fetcher.submit(
      { 
        destinationCountry: invoiceData.buyerDetails.country,
        totalValue: totalValue,
        currency: invoiceData.currency,
        hsCode: lineItems[0]?.hsCode || ""
      },
      { method: "POST", action: "/app/api/duties", encType: "application/json" }
    );
  };

  const sendEmailToCustomer = () => {
    emailFetcher.submit(
      { email: buyerDetails.email, name: buyerDetails.name } as any,
      { method: "POST", action: `/app/api/send-customs-email/${orderId}`, encType: "application/json" }
    );
  };

  const handleDownloadInvoice = () => {
    invoiceFetcher.submit(
      { invoiceData: currentInvoiceData } as any,
      { method: "POST", action: `/app/api/invoice/${orderId}`, encType: "application/json" }
    );
  };

  const handleDownloadCN = () => {
    cnFetcher.submit(
      { invoiceData: currentInvoiceData } as any,
      { method: "POST", action: `/app/api/cn-form/${orderId}`, encType: "application/json" }
    );
  };

  const suggestHsCode = (index: number, title: string) => {
    setActiveAiRowIndex(index);
    setAiError(null);
    aiFetcher.submit(
      { productTitle: title },
      { method: "POST", action: "/app/api/ai/suggest-hs-code", encType: "application/json" }
    );
  };

  // Listen for AI results
  useEffect(() => {
    if (aiFetcher.state === "idle" && aiFetcher.data && activeAiRowIndex !== null) {
      if (aiFetcher.data.success && aiFetcher.data.hsCode) {
        const newItems = [...lineItems];
        newItems[activeAiRowIndex].hsCode = aiFetcher.data.hsCode;
        setLineItems(newItems);
        (shopify as any).toast.show(`AI: ${aiFetcher.data.hsCode} (Trials left: ${aiFetcher.data.usageRemaining})`);
      } else if (aiFetcher.data.error) {
        setAiError(aiFetcher.data.error);
        (shopify as any).toast.show(aiFetcher.data.error, { isError: true });
      }
      setActiveAiRowIndex(null);
    }
  }, [aiFetcher.state, aiFetcher.data]);

  // Auto-trigger AI on page load for the first item missing an HS code
  // If we iterated all of them at once, we might exhaust trials immediately, 
  // so we trigger sequentially via activeAiRowIndex state tracking if needed, 
  // or just trigger the first empty one automatically.
  useEffect(() => {
    if (!autoAiTriggered && aiFetcher.state === "idle" && activeAiRowIndex === null) {
      const firstMissingIndex = lineItems.findIndex(i => !i.hsCode && i.title !== "Dummy 3");
      if (firstMissingIndex !== -1 && !aiError) {
        suggestHsCode(firstMissingIndex, lineItems[firstMissingIndex].title);
      } else {
        setAutoAiTriggered(true); // Don't trigger again if all are full or error occurred
      }
    }
  }, [lineItems, autoAiTriggered, aiFetcher.state, activeAiRowIndex, aiError]);

  // Download PDF helper
  const triggerDownload = (base64: string, filename: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (invoiceFetcher.state === "idle" && invoiceFetcher.data?.pdfBase64) {
      triggerDownload(invoiceFetcher.data.pdfBase64, invoiceFetcher.data.filename);
    }
  }, [invoiceFetcher.state, invoiceFetcher.data]);

  useEffect(() => {
    if (cnFetcher.state === "idle" && cnFetcher.data?.pdfBase64) {
      triggerDownload(cnFetcher.data.pdfBase64, cnFetcher.data.filename);
    }
  }, [cnFetcher.state, cnFetcher.data]);

  const updateLineItem = (index: number, field: keyof LineItemCustoms, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    // Recalculate total price if unit price or quantity changes
    if (field === 'unitPrice' || field === 'quantity') {
      newItems[index].totalPrice = newItems[index].unitPrice * newItems[index].quantity;
    }
    setLineItems(newItems);
  };

  const updateBuyerDetail = (field: keyof typeof buyerDetails, value: string) => {
    setBuyerDetails({ ...buyerDetails, [field]: value });
  };

  const isCalculating = fetcher.state !== "idle";
  const isSendingEmail = emailFetcher.state !== "idle";
  const isDownloadingInvoice = invoiceFetcher.state !== "idle";
  const isDownloadingCN = cnFetcher.state !== "idle";
  
  const dutyEstimate = fetcher.data?.estimate;
  const emailResult = emailFetcher.data;
  const customerEmail = buyerDetails.email;
  const hasEmail = !!customerEmail && customerEmail.includes('@');

  return (
    <div className="cr-dashboard animate-fade-in-up">
      {/* Header Actions */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
           <button className="cr-btn cr-btn--ghost" onClick={() => navigate('/app')} style={{ paddingLeft: 0, marginBottom: '8px' }}>
              &larr; Back to Orders
           </button>
           <h1 className="cr-hero-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>
             Order {invoiceData.orderId.replace('draft_', '')}
           </h1>
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <span className="cr-badge cr-badge--violet">Ready for Customs</span>
             <span className="cr-body-text">{invoiceData.buyerDetails.country} Destination</span>
           </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
           <button
             className="cr-btn cr-btn--secondary"
             onClick={handleDownloadCN}
             disabled={isDownloadingCN}
           >
             {isDownloadingCN ? "Generating..." : "⬇ CN22/CN23"}
           </button>
           <button
             className="cr-btn cr-btn--primary"
             onClick={handleDownloadInvoice}
             disabled={isDownloadingInvoice}
           >
             {isDownloadingInvoice ? "Generating..." : "⬇ Commercial Invoice"}
           </button>
           <button
             className="cr-btn"
             style={{
               background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
               color: '#fff',
               border: 'none',
               opacity: !hasEmail || isSendingEmail ? 0.6 : 1,
               cursor: !hasEmail || isSendingEmail ? 'not-allowed' : 'pointer',
             }}
             onClick={sendEmailToCustomer}
             disabled={!hasEmail || isSendingEmail}
             title={!hasEmail ? 'No valid customer email attached' : `Email ${customerEmail}`}
           >
             {isSendingEmail ? 'Sending...' : '✉ Email Customer'}
           </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column (Main Content) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="cr-card">
            <h2 className="cr-card-title">Editable Line Items (Customs Info)</h2>
            <p className="cr-body-text" style={{ marginBottom: '20px', color: 'var(--cr-text-secondary)' }}>
              Modify descriptions, HS codes, or values before generating documents. 
            </p>

            {aiError && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '13px' }}>
                {aiError}
              </div>
            )}
            
            <div style={{ overflowX: 'auto' }}>
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>Item & Description</th>
                    <th style={{ width: '80px' }}>Qty</th>
                    <th style={{ width: '160px' }}>HS Code</th>
                    <th style={{ width: '80px' }}>Origin</th>
                    <th style={{ textAlign: 'right', width: '100px' }}>Unit Value</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="cr-table__row">
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span className="cr-body-text" style={{ fontWeight: 500 }}>{item.title}</span>
                          <input 
                            type="text" 
                            className="cr-input" 
                            placeholder="Customs description (e.g. Cotton T-Shirt)"
                            value={item.description || item.title}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            style={{ 
                              padding: '6px 10px', 
                              border: '1px solid var(--cr-border)', 
                              borderRadius: '6px', 
                              fontSize: '13px',
                              width: '100%' 
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ padding: '6px', border: '1px solid var(--cr-border)', borderRadius: '6px', width: '60px' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={item.hsCode}
                            placeholder="e.g. 610910"
                            onChange={(e) => updateLineItem(index, 'hsCode', e.target.value)}
                            style={{ padding: '6px', border: '1px solid var(--cr-border)', borderRadius: '6px', width: '90px' }}
                          />
                          <button 
                            className="cr-btn cr-btn--secondary" 
                            style={{ padding: '6px 8px', fontSize: '12px', minWidth: 'auto', height: 'auto' }}
                            onClick={() => suggestHsCode(index, item.title)}
                            disabled={activeAiRowIndex === index}
                            title="Suggest HS Code using AI (3 free trials)"
                          >
                            {activeAiRowIndex === index ? '⏳' : '🤖 AI'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={item.countryOfOrigin}
                          maxLength={2}
                          placeholder="US"
                          onChange={(e) => updateLineItem(index, 'countryOfOrigin', e.target.value.toUpperCase())}
                          style={{ padding: '6px', border: '1px solid var(--cr-border)', borderRadius: '6px', width: '50px', textTransform: 'uppercase' }}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            style={{ padding: '6px', border: '1px solid var(--cr-border)', borderRadius: '6px', width: '80px', textAlign: 'right' }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="cr-card" style={{ padding: '24px' }}>
            <h3 className="cr-card-title" style={{ fontSize: '14px', color: 'var(--cr-text-secondary)', marginBottom: '16px' }}>
              Destination Address
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                className="cr-input" 
                placeholder="Name" 
                value={buyerDetails.name} 
                onChange={(e) => updateBuyerDetail('name', e.target.value)} 
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
              />
              <input 
                className="cr-input" 
                placeholder="Address Line 1" 
                value={buyerDetails.addressLine1} 
                onChange={(e) => updateBuyerDetail('addressLine1', e.target.value)} 
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
              />
              <input 
                className="cr-input" 
                placeholder="Address Line 2 (Optional)" 
                value={buyerDetails.addressLine2 || ''} 
                onChange={(e) => updateBuyerDetail('addressLine2', e.target.value)} 
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  className="cr-input" 
                  placeholder="City" 
                  value={buyerDetails.city} 
                  onChange={(e) => updateBuyerDetail('city', e.target.value)} 
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                />
                <input 
                  className="cr-input" 
                  placeholder="State/Prov" 
                  value={buyerDetails.province || ''} 
                  onChange={(e) => updateBuyerDetail('province', e.target.value)} 
                  style={{ width: '60px', padding: '6px 10px', fontSize: '13px' }}
                />
                <input 
                  className="cr-input" 
                  placeholder="Zip" 
                  value={buyerDetails.zip} 
                  onChange={(e) => updateBuyerDetail('zip', e.target.value)} 
                  style={{ width: '80px', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>
              <input 
                className="cr-input" 
                placeholder="Country (e.g. US)" 
                value={buyerDetails.country} 
                onChange={(e) => updateBuyerDetail('country', e.target.value.toUpperCase())} 
                maxLength={2}
                style={{ width: '80px', padding: '6px 10px', fontSize: '13px', textTransform: 'uppercase' }}
              />
            </div>
            
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--cr-border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--cr-text-secondary)' }}>✉</span>
                <input 
                  type="email"
                  className="cr-input" 
                  placeholder="Customer Email (for tracking)" 
                  value={buyerDetails.email || ''} 
                  onChange={(e) => updateBuyerDetail('email', e.target.value)} 
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          <div className="cr-card" style={{ padding: '24px' }}>
            <h3 className="cr-card-title" style={{ fontSize: '14px', color: 'var(--cr-text-secondary)', marginBottom: '16px' }}>
              Updated Summary
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
               <span className="cr-body-text">Total Items</span>
               <span className="cr-mono">{lineItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--cr-border)', paddingTop: '16px' }}>
               <span className="cr-body-text" style={{ fontWeight: 600 }}>Total Value</span>
               <span className="cr-mono" style={{ fontWeight: 600 }}>{totalValue.toFixed(2)} {invoiceData.currency}</span>
            </div>
          </div>
          
          {/* Moved Duty Estimation to Sidebar for space */}
          <div className="cr-card" style={{ padding: '24px' }}>
            <h3 className="cr-card-title" style={{ fontSize: '14px', color: 'var(--cr-text-secondary)', marginBottom: '16px' }}>
              Duty & Tax Estimation (Beta)
            </h3>
            <div className="cr-body-text" style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--cr-text-secondary)' }}>
              Estimate duties for {invoiceData.buyerDetails.country} based on {totalValue.toFixed(2)} {invoiceData.currency}.
            </div>
            {dutyEstimate ? (
              <div style={{ background: 'var(--cr-surface-sunken)', padding: '16px', borderRadius: '8px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <span className="cr-body-text" style={{ fontSize: '13px' }}>Estimated Duties</span>
                   <span className="cr-mono" style={{ fontSize: '13px', fontWeight: 600 }}>{dutyEstimate.dutyAmount} {invoiceData.currency}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span className="cr-body-text" style={{ fontSize: '13px' }}>Estimated Taxes</span>
                   <span className="cr-mono" style={{ fontSize: '13px', fontWeight: 600 }}>{dutyEstimate.taxAmount} {invoiceData.currency}</span>
                 </div>
              </div>
            ) : (
              <button 
                className="cr-btn cr-btn--secondary" 
                style={{ width: '100%' }}
                onClick={calculateDuties}
                disabled={isCalculating}
              >
                {isCalculating ? "Calculating..." : "Calculate Estimate"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  
  let errorMessage = "An unknown error occurred";
  if (isRouteErrorResponse(error)) {
    errorMessage = error.data || error.statusText;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="cr-dashboard animate-fade-in-up">
      <header style={{ marginBottom: '32px' }}>
         <button className="cr-btn cr-btn--ghost" onClick={() => navigate('/app')} style={{ paddingLeft: 0, marginBottom: '8px' }}>
            &larr; Back to Orders
         </button>
         <h1 className="cr-hero-title" style={{ fontSize: '2rem', color: '#991b1b' }}>
           Order Could Not Be Loaded
         </h1>
      </header>
      <div className="cr-card" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p className="cr-body-text" style={{ fontSize: '16px', color: 'var(--cr-text-secondary)' }}>
          We encountered an error while trying to load this order's details.
        </p>
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: '8px',
          display: 'inline-block',
          textAlign: 'left',
          maxWidth: '100%'
        }}>
          <strong>Error Details:</strong><br/>
          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{errorMessage}</span>
        </div>
      </div>
    </div>
  );
}


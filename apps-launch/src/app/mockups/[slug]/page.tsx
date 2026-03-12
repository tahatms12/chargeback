import { getAppData } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function MockupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = getAppData(slug);
  if (!app) notFound();

  return (
    <div className="min-h-screen bg-[#f1f2f4] font-sans p-8 flex items-center justify-center">
      
      {/* Fake Shopify Admin Frame */}
      <div className="w-[1024px] h-[768px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        
        {/* Fake Top Bar */}
        <div className="h-14 bg-[#1a1c1d] flex items-center px-4 justify-between shrink-0">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-[#303233] flex items-center justify-center">
                <div className="w-4 h-4 bg-[#008060] rounded-sm"></div>
             </div>
             <div className="text-white text-sm font-medium">Uplift Dev Store</div>
           </div>
           <div className="bg-[#303233] text-gray-300 text-xs px-4 py-1.5 rounded-md w-64 text-center">
             Search
           </div>
           <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
             JD
           </div>
        </div>

        {/* Fake Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Fake Sidebar */}
          <div className="w-60 bg-[#f1f2f4] border-r border-gray-200 p-4 flex flex-col gap-2 shrink-0">
             <div className="text-sm font-medium text-gray-800 p-2 rounded hover:bg-gray-200">Home</div>
             <div className="text-sm font-medium text-gray-800 p-2 rounded hover:bg-gray-200">Orders</div>
             <div className="text-sm font-medium text-gray-800 p-2 rounded hover:bg-gray-200">Products</div>
             <div className="text-sm font-medium text-gray-800 p-2 rounded hover:bg-gray-200">Customers</div>
             <div className="mt-8 text-xs font-bold text-gray-500 uppercase px-2 mb-2">Apps</div>
             <div className="text-sm font-bold text-[#008060] bg-[#e3f1ed] p-2 rounded">{app.name}</div>
          </div>

          {/* App Content Frame */}
          <div className="flex-1 bg-white p-8 overflow-y-auto">
             <div className="max-w-3xl mx-auto">
               <div className="flex justify-between items-end mb-8">
                 <div>
                   <h1 className="text-2xl font-bold text-gray-900 mb-2">{app.name} Dashboard</h1>
                   <p className="text-sm text-gray-500">{app.positioning}</p>
                 </div>
                 <button className="bg-[#008060] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#006e52]">
                   Settings
                 </button>
               </div>

               <div className="grid grid-cols-2 gap-6 mb-8">
                 <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                   <div className="text-sm text-gray-500 font-medium mb-1">Active Syncs</div>
                   <div className="text-3xl font-bold text-gray-900">24</div>
                 </div>
                 <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                   <div className="text-sm text-gray-500 font-medium mb-1">Status</div>
                   <div className="text-lg font-bold text-green-600 flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Connected
                   </div>
                 </div>
               </div>

               <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                 <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
                   <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                   <span className="text-xs text-gray-500 cursor-pointer">View all</span>
                 </div>
                 <div className="p-0">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-100 text-gray-500">
                        <tr>
                          <th className="px-6 py-3 font-medium">Event</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-6 py-4 text-gray-900">{app.features[0] || 'System Event'}</td>
                          <td className="px-6 py-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Success</span></td>
                          <td className="px-6 py-4 text-gray-500 text-right">Just now</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-gray-900">Health Check</td>
                          <td className="px-6 py-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Success</span></td>
                          <td className="px-6 py-4 text-gray-500 text-right">2 mins ago</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-gray-900">Data Synchronization</td>
                          <td className="px-6 py-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Success</span></td>
                          <td className="px-6 py-4 text-gray-500 text-right">1 hr ago</td>
                        </tr>
                      </tbody>
                    </table>
                 </div>
               </div>

             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

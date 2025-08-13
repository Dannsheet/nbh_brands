import AdminLayout from '@/components/admin/AdminLayout';

export default function Loading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {/* Product Group */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-4"></div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Color', 'Talla', 'Stock'].map((header) => (
                        <th key={header} className="px-6 py-3 text-left">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[1, 2, 3].map((row) => (
                      <tr key={row} className="animate-pulse">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-4 w-4 rounded-full bg-gray-200 mr-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Another Product Group */}
            <div className="mt-12">
              <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-4"></div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[1, 2, 3].map((header) => (
                        <th key={header} className="px-6 py-3 text-left">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[1, 2].map((row) => (
                      <tr key={row} className="animate-pulse">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-4 w-4 rounded-full bg-gray-200 mr-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

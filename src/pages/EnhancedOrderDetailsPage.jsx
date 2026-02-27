import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';

function EnhancedOrderDetailsPage() {
  const { orderId } = useParams();

  return (
    <>
      <Helmet>
        <title>Order Details - Client Dashboard</title>
        <meta name="description" content="View detailed information about your order" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Details</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Order ID: {orderId}</p>
            <p className="text-gray-600 mt-2">Order Details content coming soon...</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default EnhancedOrderDetailsPage;
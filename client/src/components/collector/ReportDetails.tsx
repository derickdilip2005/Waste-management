import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Report } from '../../types';

const ReportDetails: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [beforeImages, setBeforeImages] = useState<File[]>([]);
  const [afterImages, setAfterImages] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = () => {
    // Mock report data
    const mockReport: Report = {
      _id: reportId || '1',
      reportId: 'WR-2024-001',
      citizenId: 'citizen_1',
      citizenName: 'John Doe',
      citizenEmail: 'john@example.com',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
        address: '123 Main St, New York, NY'
      },
      images: ['/api/placeholder/400/300'],
      description: 'Large pile of household waste on sidewalk blocking pedestrian access',
      wasteType: 'household',
      status: 'assigned',
      priority: 'high',
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date(Date.now() - 172800000),
          updatedBy: 'citizen',
          notes: 'Report submitted by citizen'
        },
        {
          status: 'verified',
          timestamp: new Date(Date.now() - 86400000),
          updatedBy: 'admin',
          notes: 'Report verified by admin'
        },
        {
          status: 'assigned',
          timestamp: new Date(Date.now() - 43200000),
          updatedBy: 'admin',
          notes: 'Assigned to collector'
        }
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    setReport(mockReport);
    setNotes('');
    setLoading(false);
  };

  const handleImageUpload = (files: FileList | null, type: 'before' | 'after') => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (type === 'before') {
      setBeforeImages(prev => [...prev, ...fileArray]);
    } else {
      setAfterImages(prev => [...prev, ...fileArray]);
    }
  };

  const removeImage = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforeImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleStartWork = () => {
    // Mock start work - update local state
    if (report) {
      setReport({
        ...report,
        status: 'in_progress',
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleCompleteWork = () => {
    if (!report) return;

    // Mock complete work - simulate completion
    setUploading(true);
    
    setTimeout(() => {
      setUploading(false);
      navigate('/collector/dashboard');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchReport}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Report not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Report #{report.reportId}
            </h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm rounded-full ${
                report.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {report.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`px-3 py-1 text-sm rounded-full ${
                report.priority === 'high' ? 'bg-red-100 text-red-800' :
                report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {report.priority.toUpperCase()} PRIORITY
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/collector/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Report Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-900">{report.description}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Waste Type</h3>
            <p className="text-gray-900">{report.wasteType}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
            <p className="text-gray-900">{report.location.address || 'Address not provided'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Reported By</h3>
            <p className="text-gray-900">{report.citizenName}</p>
          </div>
        </div>

        {/* Original Images */}
        {report.images && report.images.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Original Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {report.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Original ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Work Actions */}
      {report.status === 'assigned' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Start Work</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to start working on this waste collection assignment.
          </p>
          <button
            onClick={handleStartWork}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Start Collection Work
          </button>
        </div>
      )}

      {/* Photo Upload Section */}
      {report.status === 'in_progress' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Your Work</h2>
          
          {/* Before Images */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">Before Photos</h3>
            <p className="text-sm text-gray-600 mb-3">Upload photos showing the waste before collection</p>
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files, 'before')}
              className="mb-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {beforeImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {beforeImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Before ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index, 'before')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* After Images */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">After Photos</h3>
            <p className="text-sm text-gray-600 mb-3">Upload photos showing the area after waste collection</p>
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files, 'after')}
              className="mb-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            
            {afterImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {afterImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`After ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index, 'after')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">Collection Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the collection process, challenges faced, or additional observations..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={4}
            />
          </div>

          {/* Complete Work Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCompleteWork}
              disabled={uploading || beforeImages.length === 0 || afterImages.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Completing...' : 'Complete Collection'}
            </button>
          </div>
          
          {(beforeImages.length === 0 || afterImages.length === 0) && (
            <p className="text-sm text-red-600 mt-2 text-right">
              Both before and after photos are required to complete the collection.
            </p>
          )}
        </div>
      )}

      {/* Completed Work Display */}
      {report.status === 'completed' && report.collectorImages && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.collectorImages.before && report.collectorImages.before.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">Before Photos</h3>
                <div className="grid grid-cols-2 gap-2">
                  {report.collectorImages.before.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Before ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {report.collectorImages.after && report.collectorImages.after.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">After Photos</h3>
                <div className="grid grid-cols-2 gap-2">
                  {report.collectorImages.after.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`After ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {report.collectorNotes && (
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Collection Notes</h3>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{report.collectorNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportDetails;
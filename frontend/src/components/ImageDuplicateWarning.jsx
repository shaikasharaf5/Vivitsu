import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

const ImageDuplicateWarning = ({ 
  imageDuplicates, 
  imageQualityFlags, 
  onProceedAnyway, 
  onCancel 
}) => {
  if (!imageDuplicates && !imageQualityFlags) {
    return null;
  }

  const hasDuplicates = imageDuplicates && imageDuplicates.length > 0;
  const hasQualityIssues = imageQualityFlags && imageQualityFlags.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 my-8">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
          <h2 className="text-xl font-bold">Image Quality Check</h2>
        </div>

        {/* Duplicate Images Warning */}
        {hasDuplicates && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Similar Images Found
            </h3>
            <p className="text-sm text-yellow-800 mb-3">
              Your image(s) are similar to previously reported issues:
            </p>
            <div className="space-y-2">
              {imageDuplicates.map((dup, idx) => (
                <div key={idx} className="bg-white p-2 rounded text-sm">
                  <img 
                    src={dup.url} 
                    alt="Similar" 
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                  <p className="text-gray-700">
                    <strong>Similarity:</strong> {Math.round(dup.similarity)}%
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    From issue: {dup.issueId}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Flags Warning */}
        {hasQualityIssues && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Image Quality Issues
            </h3>
            <div className="space-y-2">
              {imageQualityFlags.map((flag, idx) => (
                <div key={idx} className="bg-white p-2 rounded text-sm">
                  <p className="text-red-700">
                    <strong>⚠️ {flag.reason}</strong>
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Confidence: {Math.round(flag.confidence * 100)}%
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    This image may be flagged by moderators.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safe Images Confirmation */}
        {!hasDuplicates && !hasQualityIssues && (
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <div className="flex items-center text-green-900">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Images passed quality checks ✓</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            {hasDuplicates ? 'View Existing Issue' : 'Cancel'}
          </button>
          <button
            onClick={onProceedAnyway}
            className={`flex-1 py-2 rounded-lg text-white ${
              hasQualityIssues
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {hasDuplicates && hasQualityIssues
              ? 'Report Anyway'
              : hasDuplicates
              ? 'Report New Issue'
              : 'Continue'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          {hasDuplicates && 'Consider upvoting the existing issue instead of creating a duplicate.'}
          {hasQualityIssues && ' Flagged images may be reviewed by moderators.'}
        </p>
      </div>
    </div>
  );
};

export default ImageDuplicateWarning;

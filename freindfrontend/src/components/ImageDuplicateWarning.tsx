import { AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageDuplicateWarningProps {
  originalIssueId: string;
  similarity: number;
  onContinue: () => void;
  onCancel: () => void;
}

export function ImageDuplicateWarning({
  originalIssueId,
  similarity,
  onContinue,
  onCancel,
}: ImageDuplicateWarningProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Possible Duplicate Detected</h3>
            <p className="text-sm text-gray-500">This image may have been submitted before</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {Math.round(similarity * 100)}% similar to Issue #{originalIssueId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Our AI detected this image is similar to an existing report
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          If you believe this is a different issue, you can continue with your submission. 
          Otherwise, consider adding your feedback to the existing issue.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            View Original Issue
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

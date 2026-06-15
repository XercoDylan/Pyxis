import { useNavigate } from 'react-router-dom';
import { CourseFile } from '../../types';
import { truncateFilename } from '../../utils/formatting';

interface FileRowProps {
  file: CourseFile;
}

/**
 * Single file row displaying:
 * - Filename truncated to 80 chars
 * - Uploader name
 * - Upload date (YYYY-MM-DD)
 * Click navigates to file viewer.
 */
export default function FileRow({ file }: FileRowProps) {
  const navigate = useNavigate();

  const displayFilename = truncateFilename(file.filename);
  const uploadDate = file.uploadedAt.slice(0, 10); // YYYY-MM-DD

  return (
    <tr
      onClick={() => navigate(`/files/${file.id}`)}
      className="border-b border-neutral-700 hover:bg-primary-700 cursor-pointer transition-colors"
      role="row"
    >
      <td className="py-3 px-4 text-neutral-100 text-sm font-medium">
        {displayFilename}
      </td>
      <td className="py-3 px-4 text-neutral-400 text-sm">
        {file.uploaderName}
      </td>
      <td className="py-3 px-4 text-neutral-400 text-sm whitespace-nowrap">
        {uploadDate}
      </td>
    </tr>
  );
}

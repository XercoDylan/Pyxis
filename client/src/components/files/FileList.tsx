import { CourseFile } from '../../types';
import FileRow from './FileRow';

interface FileListProps {
  files: CourseFile[];
}

/**
 * Renders a list of FileRow components in a table layout.
 * Displays filename, uploader name, and upload date columns.
 */
export default function FileList({ files }: FileListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-700">
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-neutral-600 bg-primary-700">
            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Filename
            </th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Uploaded By
            </th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

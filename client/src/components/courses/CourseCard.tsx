import { useNavigate } from 'react-router-dom';
import { Course } from '../../types';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/courses/${course.id}`)}
      className="w-full text-left p-4 bg-primary-700 border border-neutral-700 rounded-lg hover:border-gold-500 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
      aria-label={`Open course ${course.courseNumber} - ${course.courseName}`}
    >
      <p className="text-gold-400 font-semibold text-lg">
        {course.courseNumber}
      </p>
      <p className="text-neutral-200 text-sm mt-1">{course.courseName}</p>
    </button>
  );
}

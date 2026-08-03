import { useParams, Navigate } from 'react-router-dom';

export default function AsetDetail() {
    const { id } = useParams();
    return <Navigate to={id ? `/peta?selectedId=${id}` : '/peta'} replace />;
}
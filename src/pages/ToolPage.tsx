import { Suspense, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toolBySlug } from '../data/tools';
import { usePageMeta } from '../hooks/usePageMeta';
import { actions } from '../store';
import { ToolHeader } from '../components/toolkit';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Spinner } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import NotFound from './NotFound';

export default function ToolPage() {
  const { slug } = useParams();
  const tool = toolBySlug(slug);
  usePageMeta(tool ? `${tool.name} — DevKit` : 'Tool tidak ditemukan — DevKit', tool?.description);
  const id = tool?.id;
  useEffect(() => {
    if (id) actions.recordUse(id);
  }, [id]);

  if (!tool) return <NotFound />;
  const Tool = tool.component;
  return (
    <article>
      <ToolHeader tool={tool} />
      <div className="mt-6 space-y-5">
        <ErrorBoundary resetKey={tool.id}>
          <Suspense fallback={<Spinner />}>
            <Tool />
          </Suspense>
        </ErrorBoundary>
      </div>
      <AdSlot placement="tool-bottom" className="mt-8" />
    </article>
  );
}

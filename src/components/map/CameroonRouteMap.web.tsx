import { CameroonRouteMapContent } from './CameroonRouteMapContent';

const Iframe = 'iframe' as any;

export function CameroonRouteMap() {
  return <CameroonRouteMapContent renderMap={(url) => <Iframe src={url} title="Google Maps Cameroun" loading="lazy" allowFullScreen style={{ border: 0, width: '100%', height: '100%' }} />} />;
}


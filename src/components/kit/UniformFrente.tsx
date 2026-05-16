import type { Layer, PartId } from "@/lib/kit-state";

interface Props {
  colors: Record<PartId, string>;
  layers: Layer[];
  playerNumber: string;
  playerName: string;
  onPartClick?: (part: PartId) => void;
}

const partStyle = (color: string): React.CSSProperties => ({
  fill: color,
  stroke: "#818281",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  transition: "fill 220ms ease",
  cursor: "pointer",
});

const stitch: React.CSSProperties = {
  fill: "none",
  stroke: "#818281",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function UniformFrente({ colors, layers, playerNumber, playerName, onPartClick }: Props) {
  const click = (p: PartId) => () => onPartClick?.(p);
  const isVisible = (id: string) => layers.find((l) => l.id === id)?.visible ?? true;

  const renderLayer = (id: string) => {
    if (!isVisible(id)) return null;
    switch (id) {
      case "base":
        return (
          <g key="base">
            <g id="shorts" onClick={click("shorts")}>
              <path style={partStyle(colors.shorts)} d="M1136.5,865.7c-8.7-91.9-33.6-182.7-33.6-182.7l-186,19.3-186-19.3s-25,90.8-33.6,182.7c-8.7,91.9-12.3,125.1-12.3,125.1,0,0,76.1,50,200.2,16.3,0,0,14-143,31.7-151.7,17.8,8.7,31.7,151.7,31.7,151.7,124.1,33.7,200.2-16.3,200.2-16.3,0,0-3.6-33.2-12.3-125.1Z" />
            </g>
            <g id="camisa" onClick={click("body")}>
              <path style={partStyle(colors.body)} d="M1088.1,313.5c1.5-12.3,29.1-98,7.7-139.4-21.4-41.4-100.3-78.9-100.3-78.9l-78.6,31.3-78.6-31.3s-78.8,37.5-100.3,78.9c-21.4,41.4,6.1,127.1,7.7,139.4,1.5,12.3,33.4,178.3-15.8,373.5,0,0,62.1,27.6,187,22.5,124.9,5.1,187-22.5,187-22.5-49.2-195.2-17.3-361.3-15.8-373.5Z" />
            </g>
          </g>
        );
      case "pattern":
        return null;
      case "sleeves":
        return (
          <g key="sleeves" id="mangas" onClick={click("sleeves")}>
            <path style={partStyle(colors.sleeves)} d="M1195.4,229.4c-.4-31.6-1.8-48.8-22.1-83.7-17.5-30.1-90.7-51.3-90.7-51.3l-77.6-36.1h-176.2l-77.6,36.1s-73.2,21.3-90.7,51.3c-20.3,34.8-21.7,52.1-22.1,83.7-.5,33.7-20.1,93.6-21.8,100.4,0,0,42.6,31.3,105.9,26.2l22.8-88.5h343.3l22.8,88.5c63.3,5.1,105.9-26.2,105.9-26.2-1.7-6.8-21.3-66.7-21.8-100.4Z" />
          </g>
        );
      case "collar":
        return (
          <g key="collar" id="gola" onClick={click("collar")}>
            <path style={partStyle(colors.collar)} d="M996.2,41.3s-60.3,9.6-79.3,8.6c-19.1,1-79.3-8.6-79.3-8.6-3.4,8.1-2,22.2-2,22.2,20.1,11.9,81.4,10.6,81.4,10.6,0,0,61.3,1.4,81.4-10.6,0,0,1.4-14.1-2-22.2Z" />
            <path style={partStyle(colors.collar)} d="M837.6,41.3s-7.5,52.8,79.3,75.6v19.4s-84.9-16.7-95.7-74.4c0,0,8.2-16.1,16.3-20.5Z" />
            <path style={partStyle(colors.collar)} d="M996.2,41.3s7.5,52.8-79.3,75.6v19.4s84.9-16.7,95.7-74.4c0,0-8.2-16.1-16.3-20.5Z" />
          </g>
        );
      case "details":
        return (
          <g key="details" id="costuras" style={{ pointerEvents: "none" }}>
            <path style={stitch} d="M621.9,312s35.1,29.3,104.8,27.8" />
            <path style={stitch} d="M620.1,316.7s35.1,29.3,104.8,27.8" />
            <line style={stitch} x1="737.7" y1="278.2" x2="716.5" y2="356.4" />
            <path style={stitch} d="M1211.9,312s-35.1,29.3-104.8,27.8" />
            <path style={stitch} d="M1213.6,316.7s-35.1,29.3-104.8,27.8" />
            <line style={stitch} x1="1096.1" y1="278.2" x2="1117.3" y2="356.4" />
            <path style={stitch} d="M734.2,669.1s178.9,46.7,365.5,0" />
            <path style={stitch} d="M734.2,674.9s178.9,46.7,365.5,0" />
            <path style={stitch} d="M686.9,972.6s76.6,48.6,199.9,19.2" />
            <path style={stitch} d="M686.9,977.3s76.6,48.6,199.9,19.2" />
            <path style={stitch} d="M1146.8,972.6s-76.6,48.6-199.9,19.2" />
            <path style={stitch} d="M1146.8,977.3s-76.6,48.6-199.9,19.2" />
          </g>
        );
      case "logo":
        return (
          <g key="logo" style={{ pointerEvents: "none" }}>
            <rect x="760" y="380" width="90" height="110" rx="10" fill="#FFFFFF" stroke="#818281" strokeWidth="2" opacity="0.95" />
            <text x="805" y="445" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="48" fontWeight="700" fill="#111">L</text>
          </g>
        );
      case "number":
        return (
          <g key="number" style={{ pointerEvents: "none" }}>
            <text x="990" y="560" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="170" fontWeight="800" fill="#FFFFFF" stroke="#111" strokeWidth="3">
              {playerNumber}
            </text>
          </g>
        );
      case "name":
        return null;
      default:
        return null;
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1920 1080"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {layers.map((l) => renderLayer(l.id))}
    </svg>
  );
}

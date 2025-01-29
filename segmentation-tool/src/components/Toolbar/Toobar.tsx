import React from "react";
import { AiOutlineAlibaba } from "react-icons/ai";
import { BsBrush, BsEraser } from "react-icons/bs";
import { DiSenchatouch } from "react-icons/di";
import { IoShareOutline } from "react-icons/io5";
import { LuUndo2 } from "react-icons/lu";
import { PiPolygonLight } from "react-icons/pi";

interface ToolBarProps {
	onToggleBrush: () => void;
	onTogglePolygon: () => void;
	onToggleEraser: () => void;
	onUndo: () => void;
	onExport: () => void;
	brushWidth: number;
	onBrushWidthChange: (val: number) => void;
	isBrushingActive: boolean;
	isPolygonActive: boolean;
	isEraserActive: boolean;
}

const ToolBar: React.FC<ToolBarProps> = ({
	onToggleBrush,
	onTogglePolygon,
	onToggleEraser,
	onUndo,
	onExport,
	brushWidth,
	onBrushWidthChange,
	isBrushingActive,
	isPolygonActive,
	isEraserActive,
}) => {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "space-between",
				height: "100%",
				width: "60px",
				backgroundColor: "#fff",
				borderRadius: "10px",
				boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
				padding: "10px 0",
			}}
		>
			{/* Menu de ferramentas */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "20px",
				}}
			>
				{/* Brush */}
				<button
					onClick={onToggleBrush}
					style={{
						background: isBrushingActive ? "#5E4AE3" : "none",
						border: "none",
						cursor: "pointer",
						fontSize: "30px",
						color: isBrushingActive ? "white" : "#5E4AE3",
						width: "40px",
						height: "40px",
						borderRadius: "5px",
					}}
				>
					<BsBrush />
				</button>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "5px",
					}}
				>
					<AiOutlineAlibaba
						style={{
							color: "#5E4AE3",
							fontSize: "30px",
							stroke: "2px",
						}}
					/>
					<input
						type="range"
						min={1}
						max={50}
						value={brushWidth}
						onChange={(e) => onBrushWidthChange(Number(e.target.value))}
						style={{
							width: "40px",
							writingMode: "vertical-lr",
							cursor: "pointer",
						}}
					/>

					<DiSenchatouch
						style={{
							color: "#5E4AE3",
							fontSize: "30px",
						}}
					/>
				</div>

				{/* Polygon */}
				<button
					onClick={onTogglePolygon}
					style={{
						background: isPolygonActive ? "#5E4AE3" : "none",
						border: "none",
						cursor: "pointer",
						fontSize: "30px",
						color: isPolygonActive ? "white" : "#5E4AE3",
						width: "40px",
						height: "40px",
						borderRadius: "5px",
					}}
				>
					<PiPolygonLight />
				</button>

				{/* Eraser */}
				<button
					onClick={onToggleEraser}
					style={{
						background: isEraserActive ? "#5E4AE3" : "none",
						border: "none",
						cursor: "pointer",
						fontSize: "30px",
						color: isEraserActive ? "white" : "#5E4AE3",
						width: "40px",
						height: "40px",
						borderRadius: "5px",
					}}
				>
					<BsEraser />
				</button>

				{/* Undo */}
				<button
					onClick={onUndo}
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						fontSize: "30px",
						color: "#5E4AE3",
						width: "40px",
						height: "40px",
						borderRadius: "5px",
					}}
				>
					<LuUndo2 />
				</button>
			</div>

			{/* Botão de exportação */}
			<button
				onClick={onExport}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "40px",
					height: "40px",
					backgroundColor: "#5E4AE3",
					border: "none",
					borderRadius: "20px",
					color: "#fff",
					cursor: "pointer",
					boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
				}}
			>
				<IoShareOutline size={20} />
			</button>
		</div>
	);
};

export default ToolBar;

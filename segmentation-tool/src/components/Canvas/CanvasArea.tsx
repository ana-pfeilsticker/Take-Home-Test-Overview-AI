import React, { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import { Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const CanvasArea: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
	const undoStack = useRef<string[]>([]); // Pilha de estados para undo
	const [isImageUploaded, setIsImageUploaded] = useState(false);
	const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
	const [brushColor, setBrushColor] = useState("#FF0000");
	const [brushWidth, setBrushWidth] = useState(5);
	const [isBrushing, setIsBrushing] = useState(true);

	useEffect(() => {
		if (!canvasRef.current) {
			console.error("Elemento HTML Canvas não encontrado!");
			return;
		}

		const canvasDiv = document.getElementById("canvas-div");
		if (!canvasDiv) {
			console.error("Elemento canvas-div não encontrado!");
			return;
		}

		const width = canvasDiv.clientWidth;
		const height = canvasDiv.clientHeight;

		// Inicializar o canvas com Fabric.js
		const canvas = new fabric.Canvas(canvasRef.current, {
			isDrawingMode: true,
			selection: false,
			backgroundColor: "transparent",
			width,
			height,
		});


		fabricCanvasRef.current = canvas;

		// Configurar o pincel inicial
		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.color = brushColor;
		canvas.freeDrawingBrush.width = brushWidth;

		return () => {
			canvas.dispose();
		};
	}, []);

	useEffect(() => {
		if (fabricCanvasRef.current) {
			const canvas = fabricCanvasRef.current;
			if (canvas.freeDrawingBrush) {
				canvas.freeDrawingBrush.color = brushColor;
				canvas.freeDrawingBrush.width = brushWidth;
			}
		}
	}, [brushColor, brushWidth]);

	const handleImageUpload = (file: File) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) {
				console.error("Erro ao carregar a imagem.");
				message.error("Erro ao carregar a imagem.");
				return;
			}

			// Define a imagem como background da div
			setBackgroundImage(e.target.result as string);
			setIsImageUploaded(true);
			message.success("Imagem de fundo definida com sucesso!");
		};

		reader.onerror = () => {
			console.error("Erro ao ler o arquivo com FileReader.");
			message.error("Erro ao processar o arquivo.");
		};

		reader.readAsDataURL(file);
		return false; // Evita o comportamento padrão de upload
	};

	const toggleBrushing = () => {
		if (fabricCanvasRef.current) {
			const canvas = fabricCanvasRef.current;
			canvas.isDrawingMode = !canvas.isDrawingMode; // Alterna o modo de desenho
			setIsBrushing(canvas.isDrawingMode);
		}
	};

	return (
		<div
			style={{
				height: "60%",
				width: "100%",
				borderRadius: "20px",
				position: "relative",
				backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
			id="canvas-div"
		>
			<div
				style={{
					width: "100%",
					height: "100%",
					borderRadius: "10px",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					position: "relative",
				}}
			>
				{!isImageUploaded && <Upload beforeUpload={handleImageUpload} showUploadList={false}>
					<button
						style={{
							padding: "10px 20px",
							backgroundColor: "#5E4AE3",
							color: "#fff",
							borderRadius: "8px",
							border: "none",
							cursor: "pointer",
							marginBottom: "10px",
						}}
					>
						<UploadOutlined /> Upload Image
					</button>
				</Upload>}

				<canvas
					ref={canvasRef}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
					}}
				/>
				<div style={{ marginTop: "10px" }}>
					<input
						type="color"
						value={brushColor}
						onChange={(e) => setBrushColor(e.target.value)}
					/>
					<input
						type="range"
						min={1}
						max={50}
						value={brushWidth}
						onChange={(e) => setBrushWidth(Number(e.target.value))}
					/>
					<button onClick={toggleBrushing}>
						{isBrushing ? "Disable Brush" : "Enable Brush"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CanvasArea;

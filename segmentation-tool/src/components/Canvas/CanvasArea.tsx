import React, { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import { Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import theme from "../../styles/theme";

const CanvasArea: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
	const undoStack = useRef<string[]>([]); // Pilha de estados para undo
	const [isImageUploaded, setIsImageUploaded] = useState(false);
	const [brushColor, setBrushColor] = useState("#FF0000");
	const [brushWidth, setBrushWidth] = useState(5);
	const [isBrushing, setIsBrushing] = useState(true);

	useEffect(() => {
		if (!canvasRef.current) {
			console.error("Elemento HTML Canvas não encontrado!");
			return;
		}

		// Inicializar o canvas com Fabric.js
		const canvas = new fabric.Canvas(canvasRef.current, {
			isDrawingMode: true,
			selection: false,
		});

		fabricCanvasRef.current = canvas;

		// Configurar o pincel inicial
		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.color = brushColor;
		canvas.freeDrawingBrush.width = brushWidth;

		// Redimensionar o canvas ao montar e ao redimensionar a janela
		const resizeCanvas = () => {
			const parent = canvasRef.current!.parentElement!;
			canvas.setWidth(parent.offsetWidth);
			canvas.setHeight(parent.offsetHeight);
			canvas.renderAll();
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		return () => {
			window.removeEventListener("resize", resizeCanvas);
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

	const saveState = () => {
		if (fabricCanvasRef.current) {
			const canvas = fabricCanvasRef.current;

			// Salva o estado atual como JSON
			const state = JSON.stringify(canvas.toJSON());
			undoStack.current.push(state); // Adiciona ao stack
			console.log("Estado salvo:", undoStack.current);
		}
	};

	const undo = () => {
		if (fabricCanvasRef.current && undoStack.current.length > 1) {
			const canvas = fabricCanvasRef.current;

			// Remove o estado atual do stack e carrega o estado anterior
			undoStack.current.pop();
			const previousState = undoStack.current[undoStack.current.length - 1];

			canvas.loadFromJSON(previousState, () => {
				canvas.renderAll();
				console.log("Desfeito para o estado anterior.");
			});
		} else {
			message.warning("Nada para desfazer.");
		}
	};

	const handleImageUpload = (file: File) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result || !fabricCanvasRef.current) {
				console.error("Erro ao carregar a imagem ou canvas não inicializado.");
				message.error("Erro ao carregar a imagem.");
				return;
			}

			const imageUrl = e.target.result as string;
			const imgElement = document.createElement("img");
			imgElement.src = imageUrl;

			imgElement.onload = () => {
				const img = new fabric.Image(imgElement, {
					selectable: false, // A imagem não pode ser selecionada
				});

				const canvas = fabricCanvasRef.current!;
				const canvasWidth = canvas.getWidth();
				const canvasHeight = canvas.getHeight();

				// Escalar a imagem para caber no canvas
				const scaleX = canvasWidth / img.width!;
				const scaleY = canvasHeight / img.height!;
				const scale = Math.max(scaleX, scaleY);

				img.scale(scale);
				img.set({
					left: (canvasWidth - img.width! * scale) / 2,
					top: (canvasHeight - img.height! * scale) / 2,
				});

				canvas.add(img); // Adiciona a imagem ao canvas
				canvas.renderAll();

				setIsImageUploaded(true);
				saveState(); // Salva o estado inicial com a imagem
				message.success("Imagem carregada com sucesso!");
			};

			imgElement.onerror = () => {
				console.error("Erro ao carregar a imagem no elemento <img>.");
				message.error("Erro ao carregar a imagem.");
			};
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
			}}
		>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: theme.lightBackgroundColor,
					borderRadius: "10px",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					position: "relative",
				}}
			>
				{!isImageUploaded && (
					<div
						style={{
							position: "absolute",
							zIndex: 10,
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							backgroundColor: theme.lightBackgroundColor,
							width: "100%",
							height: "100%",
							borderRadius: "10px",
						}}
					>
						<Upload beforeUpload={handleImageUpload} showUploadList={false}>
							<button
								style={{
									padding: "10px 20px",
									backgroundColor: "#5E4AE3",
									color: "#fff",
									borderRadius: "8px",
									border: "none",
									cursor: "pointer",
								}}
							>
								<UploadOutlined /> Upload Image
							</button>
						</Upload>
					</div>
				)}
				<canvas
					ref={canvasRef}
					height={600}
					width={800}
					style={{
						width: "100%",
						height: "100%",
						display: "block",
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
					<button onClick={undo} style={{ marginLeft: "10px" }}>
						Undo
					</button>
				</div>
			</div>
		</div>
	);
};

export default CanvasArea;

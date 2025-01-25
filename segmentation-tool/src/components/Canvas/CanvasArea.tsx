import React, { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import { Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import theme from "../../styles/theme";

const CanvasArea: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
	const [isImageUploaded, setIsImageUploaded] = useState(false);

	useEffect(() => {
		if (!canvasRef.current) {
			console.error("Canvas HTML element não encontrado!");
			return;
		}

		const canvas = new fabric.Canvas(canvasRef.current, {
			isDrawingMode: true,
			selection: false,
		});

		fabricCanvasRef.current = canvas;

		const resizeCanvas = () => {
			const parent = canvasRef.current!.parentElement!;
			canvas.setWidth(parent.offsetWidth);
			canvas.setHeight(parent.offsetHeight);
			canvas.renderAll();
		};

		// Redimensiona o canvas ao montar e ao redimensionar a janela
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			canvas.dispose();
		};
	}, []);

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
					selectable: false, // Desabilita a seleção, se necessário
				});

				const canvas = fabricCanvasRef.current!;
				const canvasWidth = canvas.getWidth();
				const canvasHeight = canvas.getHeight();

				// Ajustar a escala para ocupar 100% do canvas
				const scaleX = canvasWidth / img.width!;
				const scaleY = canvasHeight / img.height!;
				const scale = Math.max(scaleX, scaleY); // Usa a maior escala para cobrir totalmente o canvas

				img.scale(scale);

				// Centralizar a imagem no canvas
				img.set({
					left: (canvasWidth - img.width! * scale) / 2,
					top: (canvasHeight - img.height! * scale) / 2,
				});

				canvas.add(img);
				canvas.renderAll();
				console.log("Imagem ajustada para ocupar 100% do canvas.");
				setIsImageUploaded(true);
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
		return false;
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
					style={{
						width: "100%",
						height: "100%",
						display: "block",
					}}
				/>
			</div>
		</div>
	);
};

export default CanvasArea;

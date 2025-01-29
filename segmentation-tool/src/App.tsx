import { ConfigProvider, App as AntdApp } from "antd";
import Layout, { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import theme from "./styles/theme";
import ClassesPanel from "./components/ClassesPanel/ClassesPanel";
import CanvasArea from "./components/Canvas/CanvasArea";
import { useState } from "react";
import "./App.css";

export interface ClassItemInterface {
	id: number;
	name: string;
	color: string;
}
function App() {
	const [classes, setClasses] = useState<ClassItemInterface[]>([]);
	const [selectedClass, setSelectedClass] = useState<ClassItemInterface | null>(
		null
	);

	function handleAddClass(newClassName: string, color: string) {
		const newClass: ClassItemInterface = {
			id: classes.length + 1,
			name: newClassName,
			color,
		};
		setClasses([...classes, newClass]);
	}

	const handleClassSelect = (cls: ClassItemInterface) => {
		setSelectedClass(cls);
	};
	return (
		<ConfigProvider
			theme={{
				token: {
					colorBgBase: theme.backgroundColor,
					fontFamily: "'Montserrat', sans-serif",
				},
			}}
		>
			<AntdApp>
				<Layout id="layout" style={{ height: "100vh", background: "#FBFBFB" }}>
					<Sider
						id="sider"
						width="25%"
						style={{
							background: theme.backgroundColor,
							padding: "20px",
							minWidth: "300px",
							zIndex: "1000",
						}}
					>
						<ClassesPanel
							classes={classes} // passa o array
							selectedClassId={selectedClass?.id ?? null}
							onClassSelect={handleClassSelect}
							onAddClass={handleAddClass}
						/>
					</Sider>
					<Content
						style={{
							padding: "20px",
							gap: "25px",
							display: "flex",
						}}
					>
						<div
							style={{
								height: "100%",
								width: "100%",
								display: "flex",
								flexDirection: "column",
							}}
						>
							<CanvasArea selectedClass={selectedClass} allClasses={classes} />
						</div>
					</Content>
				</Layout>
			</AntdApp>
		</ConfigProvider>
	);
}

export default App;

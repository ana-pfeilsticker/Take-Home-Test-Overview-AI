import { ConfigProvider } from "antd";
import Layout, { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import theme from "./styles/theme";
import ClassesPanel from "./components/ClassesPanel/ClassesPanel";

function App() {
	return (
		<ConfigProvider
			theme={{
				token: {
					colorBgBase: theme.backgroundColor,
				},
			}}
		>
			<Layout style={{ height: "100vh", background: "#FBFBFB" }}>
				<Sider
					width="25%"
					style={{
						background: theme.backgroundColor,
						padding: "20px",
					}}
				>
					<ClassesPanel />
				</Sider>
				<Content style={{ padding: "20px", flexGrow: 1 }}>
					<h3 style={{ color: theme.textColor }}>Canvas</h3>
				</Content>
			</Layout>
		</ConfigProvider>
	);
}

export default App;

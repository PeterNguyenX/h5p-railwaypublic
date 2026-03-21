/// <reference types="react-scripts" />

declare namespace NodeJS {
	interface ProcessEnv {
		REACT_APP_API_URL?: string;
		REACT_APP_SUPABASE_URL?: string;
		REACT_APP_SUPABASE_ANON_KEY?: string;
		REACT_APP_FIGMA_DESIGN_URL?: string;
	}
}

import { createRouter, createWebHistory } from 'vue-router';

import Main from './views/Main.vue';
import NotFound from './views/NotFound.vue';
import QrGenerator from './views/QrGenerator.vue';

export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', component: Main },
		{ path: '/qr-contact', component: QrGenerator },
		{ path: '/:pathMatch(.*)*', component: NotFound },
	],
});

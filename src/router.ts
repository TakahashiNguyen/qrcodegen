import { createRouter, createWebHistory } from 'vue-router';

import Main from './views/Main.vue';
import NotFound from './views/NotFound.vue';
import QrContacts from './views/QrContacts.vue';
import QrLink from './views/QrLink.vue';

export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', component: Main },
		{ path: '/qr-contact', component: QrContacts },
		{path: '/link', component: QrLink},
		{ path: '/:pathMatch(.*)*', component: NotFound },
	],
});

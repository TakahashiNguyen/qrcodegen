<template>
	<FormContainerComp
		:button-handler="handleButton"
		title="Tạo QR lưu thông tin danh bạ"
	>
		<FormTextInputComp name="Tên cá nhân" v-model="input.name" />
		<FormTextInputComp name="Số điện thoại" v-model="input.phone" />
		<FormTextInputComp name="Thư điện tử" v-model="input.email" />
		<Button type="submit">Continue</Button>
		<div v-if="qrDataUrl">
			<img :src="qrDataUrl" alt="vCard QR Code" />
		</div>
	</FormContainerComp>
</template>

<script setup lang="ts">
import Button from '@/components/Button.vue';
import FormContainerComp from '@/components/FormContainer.vue';
import FormTextInputComp from '@/components/TextInput.vue';
import QRCode from 'qrcode';
import { reactive, ref } from 'vue';

const qrDataUrl = ref(''),
	input = reactive({
		name: '',
		email: '',
		phone: '',
	}),
	handleButton = async () => {
		function generateVCard() {
			const { name, phone, email } = input,
				lastName = name.split(' ')[0],
				firstName = name.split(' ').slice(-1)[0],
				middleName = name.split(' ').slice(1, -1).join(' ') || '',
				nField = [lastName, firstName, middleName, '', ''].join(';'),
				fnField = `${lastName} ${middleName} ${firstName}`.trim();

			return `
BEGIN:VCARD
VERSION:3.0
N:${nField}
FN:${fnField}
TEL;TYPE=cell:${phone}
EMAIL;INTERNET;PREF:${email}
END:VCARD
  `.trim();
		}

		qrDataUrl.value = await QRCode.toDataURL(generateVCard());
	};
</script>

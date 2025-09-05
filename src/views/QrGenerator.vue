<template>
	<FormContainerComp :button-handler="handleButton" title="Tạo QR lưu danh bạ">
		<Carousel
			indicators-location="-bottom-15 p-1 hidden"
			:indicator="{
				activeClasses: 'bg-light-primary/90',
				inactiveClasses: 'bg-light-primary/50 hover:bg-light-primary/70',
			}"
			class="mb-20 min-h-30"
		>
			<template #buttons="{ next, isEnd, previous, isStart }">
				<div
					class="right-0 -bottom-15 flex h-8 w-fit items-center justify-center [&>*]:ml-2"
				>
					<Button
						:button-ref="previous"
						theme="secondary"
						:class="{ hidden: isStart }"
					>
						Trở về
					</Button>
					<Button
						:button-ref="next"
						:class="{ hidden: isEnd }"
						:onclick="handleButton"
					>
						Hoàn tất
					</Button>
				</div>
			</template>
			<template #content>
				<div class="w-full space-y-6">
					<FormTextInputComp name="Họ và tên" v-model="input.name" />
					<FormTextInputComp name="Số điện thoại" v-model="input.phone" />
					<FormTextInputComp name="Địa chỉ thư điện tử" v-model="input.email" />
				</div>
				<div class="w-full justify-center px-16">
					<img :src="qrContact" alt="" />
				</div>
			</template>
		</Carousel>
	</FormContainerComp>
</template>

<script setup lang="ts">
import Button from '@/components/Button.vue';
import Carousel from '@/components/Carousel.vue';
import FormContainerComp from '@/components/FormContainer.vue';
import FormTextInputComp from '@/components/TextInput.vue';
import QRCode from 'qrcode';
import { reactive, ref } from 'vue';

const qrContact = ref(''),
	input = reactive({
		name: '',
		email: '',
		phone: '',
	}),
	handleButton = async () => {
		function generateVCard() {
			const { name, phone, email } = input,
				lastName = name,
				firstName = '',
				middleName = '',
				nField = [lastName, firstName, middleName, '', ''].join(';'),
				fnField = `${lastName} ${middleName} ${firstName}`.trim();

			return {
				qrContact: `
BEGIN:VCARD
VERSION:3.0
N:${nField}
FN:${fnField}
TEL;TYPE=cell:${phone}
EMAIL;INTERNET;PREF:${email}
END:VCARD
  `.trim(),
				qrPhone: `MECARD:TEL:${phone};;`,
			};
		}

		const { qrContact: qrC } = generateVCard(),
			qrOptions: QRCode.QRCodeToDataURLOptions = { margin: 0, width: 512 };
		qrContact.value = await QRCode.toDataURL(qrC, qrOptions);
	};
</script>

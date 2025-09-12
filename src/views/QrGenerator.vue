<template>
	<FormContainerComp :button-handler="handleButton" title="Tạo QR lưu danh bạ">
		<Carousel
			indicators-location="-bottom-15 p-1 hidden"
			:indicator="{
				activeClasses: 'bg-light-primary/90',
				inactiveClasses: 'bg-light-primary/50 hover:bg-light-primary/70',
			}"
			class="mb-20 min-h-30"
			ref="carousel"
		>
			<template #buttons="{ isEnd, previous, isStart }">
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
						ref="submitButton"
						:class="{ hidden: isEnd }"
						:onclick="handleButton"
					>
						Hoàn tất
					</Button>
					<Button :class="{ hidden: isStart }" :onclick="qrDownload">
						Tải ảnh
					</Button>
				</div>
			</template>
			<template #content>
				<div class="w-full space-y-6">
					<TextInput name="Họ và tên" v-model="input.name" />
					<TextInput name="Số điện thoại" v-model="input.phone" />
					<TextInput name="Địa chỉ thư điện tử" v-model="input.email" />
					<TextInput name="Số phòng" v-model="input.address" />
					<TextInput name="Link url fanpage" v-model="input.url" />
					<SelectInput
						name="Cấp độ (càng cao càng chi tiết; mặc định: thấp)"
						:list="qrLevel"
						v-model="input.errorLevel"
					/>
					<TextInput
						type="file"
						@change="handleFileChange"
						accept="image/*"
						name="Ảnh logo"
					/>
					<TextInput
						v-if="logoDraw"
						name="Tỉ lệ logo so với gốc"
						v-model="input.logoRatio"
					/>
					<div v-if="error">
						<a class="text-error">{{ error }}</a>
					</div>
				</div>
				<div class="aspect-square w-full">
					<canvas ref="qrCode" class="!size-full" />
				</div>
			</template>
		</Carousel>
	</FormContainerComp>
</template>

<script setup lang="ts">
import { sleep } from '@/app/functions';
import Button from '@/components/Button.vue';
import Carousel from '@/components/Carousel.vue';
import FormContainerComp from '@/components/FormContainer.vue';
import SelectInput from '@/components/SelectInput.vue';
import TextInput from '@/components/TextInput.vue';
import QrScanner from 'qr-scanner';
import QRCode, { type QRCodeErrorCorrectionLevel } from 'qrcode';
import { reactive, ref } from 'vue';

const qrCode = ref<HTMLCanvasElement>(),
	qrLevel = ref<Map<string, QRCodeErrorCorrectionLevel>>(new Map()),
	input = reactive<{
		errorLevel: QRCodeErrorCorrectionLevel;
		name: '';
		email: '';
		phone: '';
		address: '';
		url: '';
		logoRatio: 1;
	}>({
		name: '',
		email: '',
		phone: '',
		address: '',
		url: '',
		logoRatio: 1,
		errorLevel: 'L',
	}),
	logoReader = new FileReader(),
	logoDraw = ref<Function>(),
	carousel = ref<typeof Carousel>(),
	submitButton = ref<typeof Button>(),
	error = ref(''),
	qrDownload = async () => {
		qrCode.value!.toBlob((blob) => {
			if (!blob) return;

			const url = URL.createObjectURL(blob),
				a = document.createElement('a');
			a.href = url;
			a.download = input.name + '.png';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 'image/png');
	},
	handleButton = async () => {
		error.value = '';
		submitButton.value?.toggleLoading();

		function generateVCard() {
			const { name, phone, email, address, url } = input,
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
ADR;TYPE=WORK;PREF=1;LABEL="":;Trường Đại học Tôn Đức Thắng;Phòng ${address};phường Tân Phong;19 Nguyễn Hữu Thọ;Thành phố Hồ Chí Minh;Việt Nam
URL:${url}
END:VCARD
  `.trim(),
				qrPhone: `MECARD:TEL:${phone};;`,
			};
		}

		const { qrContact: value } = generateVCard(),
			qrOptions: QRCode.QRCodeToDataURLOptions = {
				margin: 5,
				width: 4096,
				errorCorrectionLevel: input.errorLevel,
			};

		QRCode.toCanvas(qrCode.value, value, qrOptions);

		logoDraw.value?.();

		await sleep(10);

		try {
			const decoded = await QrScanner.scanImage(qrCode.value!);

			if (decoded !== value) throw new Error();

			carousel.value?.next();
		} catch {
			error.value = 'Logo quá lớn, không thể nhận dạng.';
		}

		submitButton.value?.toggleLoading();
	};

logoReader.onload = (e) => {
	const img = new Image();

	img.onload = () => {
		if (qrCode.value) {
			const ctx = qrCode.value.getContext('2d'),
				ele = qrCode.value,
				imgWidth = img.width * input.logoRatio,
				imgHeight = img.height * input.logoRatio;

			if (ctx) {
				ctx.drawImage(
					img,
					(ele.width - imgWidth) / 2,
					(ele.height - imgHeight) / 2,
					imgWidth,
					imgHeight,
				);
			}
		}
	};

	img.src = e.target?.result as string;
};

function handleFileChange(event: Event) {
	const input = event.target as HTMLInputElement;

	if (input.files && input.files[0]) {
		const file = input.files[0];

		logoDraw.value = () => logoReader.readAsDataURL(file);
	}
}

qrLevel.value.set('Cao', 'high');
qrLevel.value.set('Trung bình', 'medium');
qrLevel.value.set('Thấp', 'low');
</script>

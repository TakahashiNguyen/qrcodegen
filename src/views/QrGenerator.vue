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
						theme="secondary"
						v-if="isAutoAlignLogo"
						:onclick="toggleAutoAlignLogo"
					>
						Quay lại
					</Button>
					<Button
						:theme="isAutoAlignLogo ? 'primary' : 'secondary'"
						:class="{ hidden: drawLogo == null || isEnd }"
						:onclick="autoAlignLogo"
						v-if="!isProcessing"
					>
						{{ isAutoAlignLogo ? 'Xác nhận' : 'Tự động căn chỉnh logo' }}
					</Button>
					<Button
						:button-ref="previous"
						theme="secondary"
						:class="{ hidden: isStart }"
					>
						Trở về
					</Button>
					<Button
						v-if="!isAutoAlignLogo"
						ref="submitButton"
						:class="{ hidden: isEnd }"
						:onclick="handleButton"
					>
						Xác nhận
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
					<TextInput name="Số phòng" v-model="input.roomNumber" />
					<TextInput name="Link fanpage" v-model="input.pageLink" />
					<SelectInput
						name="Cấp độ (càng cao, mã QR càng chi tiết)"
						:list="qrCodeLevels"
						v-model="input.errorCorrectionLevel"
					/>
					<TextInput
						type="number"
						name="Độ lớn viền trắng"
						v-model="input.qrMargin"
					/>
					<TextInput
						type="file"
						@change="handleFileChange"
						accept="image/*"
						name="Ảnh logo"
					/>
					<TextInput
						type="number"
						v-if="
							drawLogo &&
							(!isAutoAlignLogo || (input.autoAlignMode & (1 << 1)) === 0)
						"
						name="Tỉ lệ logo so với gốc"
						v-model="input.logoScale"
					/>
					<TextInput
						type="number"
						v-if="
							drawLogo &&
							(!isAutoAlignLogo || (input.autoAlignMode & (1 << 0)) === 0)
						"
						name="Độ lớn góc xoay mã QR"
						v-model="input.logoRotation"
					/>
					<SelectInput
						v-if="isAutoAlignLogo"
						name="Chế độ tự căn chỉnh"
						:list="autoAlignLogoMode"
						v-model="input.autoAlignMode"
					/>
					<TextInput
						type="number"
						v-if="isAutoAlignLogo && (input.autoAlignMode & (1 << 0)) !== 0"
						name="Độ lớn bước góc xoay mã QR"
						v-model="input.rotationStep"
					/>
					<SelectInput
						v-if="isAutoAlignLogo && (input.autoAlignMode & (1 << 1)) !== 0"
						name="Thuật toán tìm tỉ lệ logo"
						:list="autoScaleLogoMode"
						v-model="input.autoScaleMode"
					/>
					<div v-if="errorMessage && !isProcessing">
						<a class="text-error">{{ errorMessage }}</a>
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
import jsQR from 'jsqr';
import QRCode, { type QRCodeErrorCorrectionLevel } from 'qrcode';
import { reactive, ref } from 'vue';

const qrCode = ref<HTMLCanvasElement>(),
	qrCodeLevels = ref<Map<string, QRCodeErrorCorrectionLevel>>(new Map()),
	autoAlignLogoMode = ref<Map<string, number>>(new Map()),
	autoScaleLogoMode = ref<Map<string, number>>(new Map()),
	qrCodeWidth = 4096,
	input = reactive<{
		errorCorrectionLevel: QRCodeErrorCorrectionLevel;
		name: string;
		email: string;
		phone: string;
		roomNumber: string;
		pageLink: string;
		logoScale: number;
		logoRotation: number;
		qrMargin: number;
		rotationStep: number;
		autoAlignMode: number;
		autoScaleMode: number;
	}>({
		name: 'Phòng Công tác học sinh - sinh viên',
		email: 'phongctct-hssv@tdtu.edu.vn',
		phone: '02837755054',
		roomNumber: 'A0003',
		pageLink: 'fb.com/pcthssv.tdtu',
		logoScale: 1,
		errorCorrectionLevel: 'L',
		logoRotation: 0,
		qrMargin: 20,
		rotationStep: 90,
		autoAlignMode: 3,
		autoScaleMode: 0,
	}),
	drawLogo = ref<Function>(),
	logoSize = ref<{ width: number; height: number }>(),
	carousel = ref<InstanceType<typeof Carousel>>(),
	submitButton = ref<InstanceType<typeof Button>>(),
	isAutoAlignLogo = ref(false),
	isProcessing = ref(false),
	errorMessage = ref(''),
	toggleAutoAlignLogo = () => {
		isAutoAlignLogo.value = !isAutoAlignLogo.value;
	};

async function qrDownload() {
	qrCode.value!.toBlob((blob) => {
		if (!blob) return;

		const pageLink = URL.createObjectURL(blob),
			a = document.createElement('a');
		a.href = pageLink;
		a.download = input.name + '.png';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(pageLink);
	}, 'image/png');
}

async function autoAlignLogo() {
	async function autoScale(): Promise<number> {
		const precision = 1,
			base = 10,
			multiplier = Math.pow(base, precision),
			{ width: logoWidth, height: logoHeight } = logoSize.value!;

		let lower = 0,
			upper = Math.floor(
				((1.0 * qrCodeWidth) /
					Math.sqrt(logoWidth * logoWidth + logoHeight * logoHeight)) *
					multiplier,
			);

		switch (input.autoScaleMode) {
			case 0:
				while (lower <= upper && upper / multiplier > scale) {
					const mid = Math.floor((lower + upper) / 2);

					input.logoScale = mid / multiplier;

					if (!(await drawQrCode())) upper = mid - 1;
					else lower = mid + 1;
				}
				return Math.floor((lower + upper) / 2) / multiplier;

			case 1:
				for (; upper > 0 && upper / multiplier > scale; upper--) {
					input.logoScale = upper / multiplier;

					if (await drawQrCode()) return upper / multiplier;
				}
				break;
		}

		return -1;
	}

	async function autoRotate(
		func: () => Promise<boolean> | boolean = () => drawQrCode(),
	): Promise<number> {
		let outputAngle = 0;

		for (let i = 90; i < 450; i += input.rotationStep) {
			input.logoRotation = i;

			if (await func()) outputAngle = i;
		}

		return outputAngle;
	}

	if (!isAutoAlignLogo.value) {
		toggleAutoAlignLogo();

		return;
	}

	toggleAutoAlignLogo();
	isProcessing.value = !isProcessing.value;
	await sleep(1);
	submitButton.value!.toggleLoading();
	carousel.value!.toggleLoading();

	let scale = 0,
		rotate = 0;

	switch (input.autoAlignMode) {
		case 3:
			rotate = await autoRotate(async () => {
				const currentScale = await autoScale();

				if (currentScale > scale) {
					scale = currentScale;
					return true;
				}

				return false;
			});

			input.logoScale = scale;
			input.logoRotation = rotate;
			break;

		case 2:
			input.logoScale = await autoScale();
			break;

		case 1:
			input.logoRotation = await autoRotate();
			break;
	}

	if (await drawQrCode(qrCode.value!)) carousel.value?.next();
	else errorMessage.value = 'Tùy chỉnh không phù hợp. Vui lòng chỉnh lại.';

	carousel.value?.toggleLoading();
	isProcessing.value = !isProcessing.value;
	submitButton.value!.toggleLoading();
	errorMessage.value = '';
}

async function drawQrCode(
	targetCanvas: HTMLCanvasElement = (() => {
		const off = document.createElement('canvas');

		off.width = qrCodeWidth;
		off.height = qrCodeWidth;

		return off;
	})(),
): Promise<boolean> {
	function generateVCard() {
		const { name, phone, email, roomNumber, pageLink } = input,
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
ADR;TYPE=WORK;PREF=1;LABEL="":;Trường Đại học Tôn Đức Thắng;Phòng ${roomNumber};phường Tân Phong;19 Nguyễn Hữu Thọ;Thành phố Hồ Chí Minh;Việt Nam
URL:${pageLink}
END:VCARD
  `.trim(),
			qrPhone: `MECARD:TEL:${phone};;`,
		};
	}

	const { qrContact: content } = generateVCard(),
		qrOptions: QRCode.QRCodeToDataURLOptions = {
			margin: input.qrMargin,
			width: qrCodeWidth,
			errorCorrectionLevel: input.errorCorrectionLevel,
		};

	await QRCode.toCanvas(targetCanvas, content, qrOptions);

	await drawLogo.value?.(targetCanvas);

	try {
		const { data: decoded } = jsQR(
			targetCanvas
				.getContext('2d', {
					willReadFrequently: true,
				})!
				.getImageData(0, 0, qrCodeWidth, qrCodeWidth)!.data,
			qrCodeWidth,
			qrCodeWidth,
		)!;

		if (decoded !== content) throw new Error();
	} catch (e) {
		errorMessage.value = 'Logo quá lớn, không thể nhận dạng.';

		return false;
	}

	return true;
}

async function handleButton(): Promise<void> {
	errorMessage.value = '';

	submitButton.value?.toggleLoading();
	carousel.value?.toggleLoading();
	isProcessing.value = !isProcessing.value;
	await sleep(1);

	if (await drawQrCode(qrCode.value!)) carousel.value?.next();

	submitButton.value?.toggleLoading();
	carousel.value?.toggleLoading();
	isProcessing.value = !isProcessing.value;
	await sleep(1);
}

function fileToDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const fr = new FileReader();
		fr.onload = () => resolve(fr.result as string);
		fr.onerror = () => reject(fr.error);
		fr.readAsDataURL(file);
	});
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = src;
	});
}

async function drawImageToCanvas(targetCanvas: HTMLCanvasElement, file: File) {
	const ctx = targetCanvas.getContext('2d', {
			willReadFrequently: true,
		})!,
		ele = targetCanvas,
		img = await loadImage(await fileToDataURL(file)),
		imgWidth = img.width * input.logoScale,
		imgHeight = img.height * input.logoScale,
		angle = (input.logoRotation / 180) * Math.PI;

	// Draw image to canvas
	ctx.save();
	ctx.translate(ele.width / 2, ele.height / 2);
	ctx.rotate(angle);
	ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
	ctx.restore();

	// Rotate canvas
	const imageData = ctx.getImageData(0, 0, qrCodeWidth, qrCodeWidth);

	ctx.save();
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, qrCodeWidth, qrCodeWidth);
	ctx.translate(qrCodeWidth / 2, qrCodeWidth / 2);
	ctx.rotate(-angle);

	const off = document.createElement('canvas');
	off.width = qrCodeWidth;
	off.height = qrCodeWidth;

	const offCtx = off.getContext('2d'),
		maxScale = 1 / (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)));
	if (offCtx) {
		offCtx.putImageData(imageData, 0, 0);
		ctx.scale(maxScale, maxScale);
		ctx.drawImage(off, -qrCodeWidth / 2, -qrCodeWidth / 2);
	}
	ctx.restore();
}

async function handleFileChange(event: Event) {
	const element = event.target as HTMLInputElement,
		file = element.files?.[0];

	if (!file) {
		drawLogo.value = undefined;
		return;
	}

	logoSize.value = await getImageDimensions(file);

	drawLogo.value = async (targetCanvas: HTMLCanvasElement) =>
		drawImageToCanvas(targetCanvas, file);
}

function getImageDimensions(
	file: File,
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				resolve({ width: img.width, height: img.height });
			};
			img.onerror = () => {
				reject(new Error('Unable to load image.'));
			};
			img.src = reader.result as string;
		};
		reader.onerror = () => {
			reject(new Error('Error reading file.'));
		};
		reader.readAsDataURL(file);
	});
}

qrCodeLevels.value.set('Cao', 'H');
qrCodeLevels.value.set('Trung bình', 'M');
qrCodeLevels.value.set('Thấp', 'L');

autoAlignLogoMode.value.set('Góc và tỉ lệ logo', 3);
autoAlignLogoMode.value.set('Chỉ góc', 1);
autoAlignLogoMode.value.set('Chỉ tỉ lệ logo', 2);

autoScaleLogoMode.value.set('Nhị phân (nhanh)', 0);
autoScaleLogoMode.value.set('Tuần tự (chậm)', 1);
</script>

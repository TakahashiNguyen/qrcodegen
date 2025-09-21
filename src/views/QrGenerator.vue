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
						:class="{ hidden: drawLogo == null || isEnd }"
						:onclick="autoAlignLogo"
						ref="autoAlignLogoButton"
					>
						Tự động căn chỉnh logo
					</Button>
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
					<TextInput name="Số phòng" v-model="input.roomNumber" />
					<TextInput name="Link pageLink fanpage" v-model="input.pageLink" />
					<SelectInput
						name="Cấp độ (càng cao, mã QR càng chi tiết)"
						:list="qrCodeLevels"
						v-model="input.errorCorrectionLevel"
					/>
					<TextInput
						type="file"
						@change="handleFileChange"
						accept="image/*"
						name="Ảnh logo"
					/>
					<TextInput
						v-if="drawLogo"
						name="Tỉ lệ logo so với gốc"
						v-model="input.logoScale"
					/>
					<TextInput
						v-if="drawLogo"
						name="Độ lớn góc xoay mã QR"
						v-model="input.logoRotation"
						default-value="0"
					/>
					<div v-if="errorMessage">
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
	qrCodeWidth = 4096,
	qrCodeContent = ref<string>(''),
	qrCodeCanvasCtx = ref<CanvasRenderingContext2D>(),
	input = reactive<{
		errorCorrectionLevel: QRCodeErrorCorrectionLevel;
		name: string;
		email: string;
		phone: string;
		roomNumber: string;
		pageLink: string;
		logoScale: number;
		logoRotation: number;
	}>({
		name: 'Phòng Công tác học sinh - sinh viên',
		email: 'phongctct-hssv@tdtu.edu.vn',
		phone: '02837755054',
		roomNumber: 'A0003',
		pageLink: 'fb.com/pcthssv.tdtu',
		logoScale: 1,
		errorCorrectionLevel: 'L',
		logoRotation: 0,
	}),
	drawLogo = ref<Function>(),
	logoSize = ref<{ width: number; height: number }>(),
	carousel = ref<typeof Carousel>(),
	submitButton = ref<typeof Button>(),
	autoAlignLogoButton = ref<typeof Button>(),
	errorMessage = ref(''),
	qrDownload = async () => {
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
	},
	autoAlignLogo = async () => {
		autoAlignLogoButton.value?.toggleLoading();

		const qrCodeImageData = await drawQrCode(),
			autoScale = async (): Promise<number> => {
				const checker = (ratio: number): Promise<boolean> => {
						input.logoScale = ratio;

						qrCodeCanvasCtx.value!.putImageData(qrCodeImageData, 0, 0);

						return handleButton(true);
					},
					precision = 1,
					multiplier = Math.pow(10, precision),
					{ width: logoWidth, height: logoHeight } = logoSize.value!;

				let lower = 0,
					upper = Math.floor(
						((1.0 * qrCodeWidth) / Math.max(logoWidth, logoHeight)) *
							multiplier,
					);

				while (lower <= upper) {
					const mid = Math.floor((lower + upper) / 2);

					if (!(await checker(mid / multiplier))) upper = mid - 1;
					else lower = mid + 1;
				}

				return Math.floor((lower + upper) / 2) / multiplier;
			},
			autoRotate = async (): Promise<{ scale: number; rotate: number }> => {
				input.logoRotation = 0;

				let scale = await autoScale(),
					rotate = 0;

				for (let i = 90; i < 360; i += 90) {
					input.logoRotation = i;

					const currentScale = await autoScale();

					if (currentScale > scale) {
						rotate = i;
						scale = currentScale;
					}
				}

				return { scale, rotate };
			};

		const { scale, rotate } = await autoRotate();

		input.logoScale = scale;
		input.logoRotation = rotate;

		qrCodeCanvasCtx.value!.putImageData(qrCodeImageData, 0, 0);
		await handleButton(false);

		autoAlignLogoButton.value?.toggleLoading();
	},
	drawQrCode = async (): Promise<ImageData> => {
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

		const { qrContact: value } = generateVCard(),
			qrOptions: QRCode.QRCodeToDataURLOptions = {
				margin: 5,
				width: qrCodeWidth,
				errorCorrectionLevel: input.errorCorrectionLevel,
			};

		qrCodeContent.value = value;

		await QRCode.toCanvas(qrCode.value, value, qrOptions);

		qrCodeCanvasCtx.value = qrCode.value!.getContext('2d', {
			willReadFrequently: true,
		})!;

		return qrCodeCanvasCtx.value!.getImageData(0, 0, qrCodeWidth, qrCodeWidth)!;
	},
	handleButton = async (isAutoAlignLogo: boolean = false) => {
		errorMessage.value = '';

		if (typeof isAutoAlignLogo != 'boolean') isAutoAlignLogo = false;

		if (!isAutoAlignLogo) {
			submitButton.value?.toggleLoading();
			await drawQrCode();
		}

		await drawLogo.value?.();

		try {
			const { data: decoded } = jsQR(
				qrCodeCanvasCtx.value!.getImageData(0, 0, qrCodeWidth, qrCodeWidth)!
					.data,
				qrCodeWidth,
				qrCodeWidth,
			)!;

			if (decoded !== qrCodeContent.value) throw new Error();

			if (isAutoAlignLogo) return true;

			qrCode.value!.style.rotate = `-${input.logoRotation}deg`;

			carousel.value?.next();
		} catch (e) {
			if (isAutoAlignLogo) return false;

			errorMessage.value = 'Logo quá lớn, không thể nhận dạng.';
		}

		submitButton.value?.toggleLoading();

		return false;
	};

async function handleFileChange(event: Event) {
	const element = event.target as HTMLInputElement;

	if (element.files && element.files[0]) {
		const file = element.files[0];

		logoSize.value = await getImageDimensions(file);

		drawLogo.value = async () =>
			new Promise<void>((resolve, reject) => {
				const logoReader = new FileReader();

				logoReader.onload = (e) => {
					const img = new Image();

					img.onload = () => {
						if (qrCode.value) {
							const ctx = qrCodeCanvasCtx.value,
								ele = qrCode.value,
								imgWidth = img.width * input.logoScale,
								imgHeight = img.height * input.logoScale;

							if (ctx) {
								ctx.save();

								ctx.translate(ele.width / 2, ele.height / 2);

								ctx.rotate((input.logoRotation / 180) * Math.PI);

								ctx.drawImage(
									img,
									-imgWidth / 2,
									-imgHeight / 2,
									imgWidth,
									imgHeight,
								);

								ctx.restore();

								resolve();
							}

							reject('Canvas not found');
						}

						reject('Invalid QR content');
					};

					img.src = e.target?.result as string;
				};

				logoReader.readAsDataURL(file);
			});
	} else drawLogo.value = undefined;
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
</script>

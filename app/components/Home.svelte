<script context='module'>
	import { registerNativeViewElement } from 'svelte-native/dom'
	import { Video } from 'nativescript-videoplayer'

	registerNativeViewElement('videoPlayer', () => Video)

	const choose_media = activity => new Promise((resolve, reject) => {
		try {
			/* const intent = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT) */
			const intent = new android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT)
			intent.setType("*/*")
			intent.addCategory(android.content.Intent.CATEGORY_OPENABLE)
			const mimeTypes = Array.create(java.lang.String, 2)
			mimeTypes[0] = "audio/*"
			mimeTypes[1] = "video/*"
			intent.putExtra(android.content.Intent.EXTRA_MIME_TYPES, mimeTypes)
			activity.onActivityResult = (requestCode, resultCode, data) => resolve({ resultCode, data })
			activity.startActivityForResult(intent, 1)
		} catch (error) {
			reject(error)
		}
	})

	const media_from_intent = intent => ({
		uri: intent.getData().toString(),
		type: intent.getType()
	})

	const request_all_files_access_permission = activity => new Promise(resolve => {
		const intent = new android.content.Intent(android.provider.Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
		activity.onActivityResult = (requestCode, resultCode, data) => resolve({ resultCode, data })
		activity.startActivityForResult(intent, 1)
	})

	const has_all_files_access_permission = () => android.os.Environment.isExternalStorageManager()
</script>

<script>
	import { android as androidApp } from '@nativescript/core/application'
	import { onMount } from 'svelte'

	let page
	let videoPlayer
	let media = null

	const get_current_activity = () => androidApp.foregroundActivity || androidApp.startActivity

	const file_access_permission_statuses = {
		UNKNOWN: 'UNKNOWN',
		REQUESTED: 'REQUESTED',
		DENIED: 'DENIED',
		GRANTED: 'GRANTED'
	}
	let file_access_permission_status = file_access_permission_statuses.UNKNOWN

	let status = 'initial'

	// TODO: const once_permissions_granted
	const setup_video_player = async ({ activity }) => {
		const intent = activity.getIntent()

		if (intent.getData() === null) {
			const { data } = await choose_media(activity)
			if (data.getData() === null) {
				// TODO: no media
			} else {
				media = media_from_intent(data)
			}
		} else {
			media = media_from_intent(intent)
		}

		if (media !== null) {
			const play_pause = () => {
				if (videoPlayer.isPlaying()) {
					videoPlayer.pause()
				} else {
					videoPlayer.play()
				}
			}

			const back = () => activity.onBackPressed()

			const button_handlers = {
				[android.view.KeyEvent.KEYCODE_BUTTON_A]: ({ play_pause }) => play_pause,
				[android.view.KeyEvent.KEYCODE_BUTTON_B]: ({ back }) => back()
			}

			const handle_gamepad_input = (keyCode, event) => {
				if ((event.getSource() & android.view.InputDevice.SOURCE_GAMEPAD) == android.view.InputDevice.SOURCE_GAMEPAD) {
					const handler = button_handlers[keyCode]
					if (handler) {
						handler({
							play_pause,
							back
						})
					}
					return true
				}
				return false
			}

			/* activity.dispatchKeyEvent= event => { */
			/* 	const keyCode = event.getKeyCode() */
			/* 	console.log({ keyCode, event }) */
			/* 	return handle_gamepad_input(keyCode, event) || activity.super.onKeyDown(keyCode, event) */
			/* } */
			/* videoPlayer._nativeElement.on(Video.errorEvent, event => status = event.data.error.message) */
			/* videoPlayer._nativeElement.on(Video.playbackReadyEvent, event => status = 'ready to play') */
		}
	}

	onMount(async () => {
		const activity = get_current_activity()

		activity.getWindow().setStatusBarColor(android.graphics.Color.parseColor("#000000"))

		try {
			const activity = get_current_activity()

			if (has_all_files_access_permission()) {
				file_access_permission_status = file_access_permission_statuses.GRANTED
				await setup_video_player({ activity })
			} else {
				file_access_permission_status = file_access_permission_statuses.REQUESTED
				const { resultCode, data } = await request_all_files_access_permission(activity)
				if (resultCode === android.app.Activity.RESULT_OK || result === android.app.Activity.RESULT_CANCELED) {
					if (has_all_files_access_permission()) {
						file_access_permission_status = file_access_permission_statuses.GRANTED
						await setup_video_player({ activity })
					} else {
						file_access_permission_status = file_access_permission_statuses.DENIED
					}
				} else {
					throw new Error(`Unexpected Activity result code: ${resultCode}`)
				}
			}
		} catch (error) {
			status = error.message
		}

		try {
			/* page.nativeView.android.setOnKeyListener(new android.view.View.OnKeyListener({ */
			/* 	onKey: function (view, keyCode, keyevent) { */
			/* 		console.log({ keyCode }) */
			/* 		return true */
			/* 	} */
			/* })) */
			/* page.nativeView.onKeyDown = (view, keyCode, event) => { */
			/* 	console.log({ keyCode }) */
			/* 		/1* if (event.getAction() === android.view.KeyEvent.ACTION_DOWN) { *1/ */
			/* 		/1*     return handle_key_down(event); *1/ */
			/* 		/1* } *1/ */
			/* 		/1* return false; *1/ */
			/* } */
		} catch (error) { status = error.message }
	})
</script>

<page
	actionBarHidden='true'
	style='background-color: #000000'
>
	<actionBar title="Video Player"/>
	<gridLayout rows='*' columns='*'>
		{#if media}
			<videoPlayer
				bind:this={videoPlayer}
				src="{media.uri}"
				headers={new Map([ [ 'Content-Type', media.type ] ])}
				controls="true"
				loop="true"
				autoplay="true"
			/>
		{/if}
	</gridLayout>
</page>

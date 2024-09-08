function getContentMediaUri(data) {
	try {
		const contentResolver = androidApp.context.getContentResolver();
		const projection = [android.provider.MediaStore.MediaColumns.DATA];

		const cursor = contentResolver.query(data, projection, null, null, null);
		if (cursor !== null) {
			try {
				const columnIndex = cursor.getColumnIndexOrThrow(projection[0]);
				if (cursor.moveToFirst()) {
					const filePath = cursor.getString(columnIndex);
					const uri = android.net.Uri.parse("file://" + filePath);  // Or custom PathToUri function
					return uri !== null ? uri : data;
				}
			} finally {
				cursor.close();
			}
		}
		return data;
	} catch (e) {
		// TODO:
		/* if (e instanceof java.lang.SecurityException || */
		/* 	e instanceof java.lang.IllegalArgumentException || */
		/* 	e instanceof java.lang.NullPointerException) { */
		/* 	console.error("Error handling URI:", e); */
		/* 	return data; */
		/* } else { */
		/* 	throw e;  // Re-throw other exceptions */
		/* } */
	}
}

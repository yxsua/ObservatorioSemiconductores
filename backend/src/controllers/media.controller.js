const mediaService = require("../services/media.service");

function commonHeaders(descriptor, cacheControl) {
    return {
        "Cache-Control": cacheControl,
        "X-Content-Type-Options": "nosniff",
        ...(descriptor.checksum ? { ETag: `"${descriptor.checksum}"` } : {})
    };
}

function sendLocal(res, descriptor, attachment) {
    const headers = commonHeaders(
        descriptor,
        attachment ? "private, no-store" : "public, max-age=3600"
    );
    return new Promise((resolve, reject) => {
        const callback = (error) => error ? reject(error) : resolve();
        if (attachment) {
            res.download(
                descriptor.storage.path,
                descriptor.filename,
                { headers },
                callback
            );
            return;
        }
        res.type(descriptor.mimeType);
        res.set(headers);
        res.set("Content-Disposition", `inline; filename="${descriptor.filename}"`);
        res.sendFile(descriptor.storage.path, callback);
    });
}

async function inline(req, res) {
    const descriptor = await mediaService.getInline(req.params.id);
    if (descriptor.storage.kind === "remote") {
        res.set(commonHeaders(descriptor, "public, max-age=300"));
        return res.redirect(302, descriptor.storage.url);
    }
    return sendLocal(res, descriptor, false);
}

async function download(req, res) {
    const descriptor = await mediaService.getDownload(req.params.id);
    if (descriptor.storage.kind === "remote") {
        res.set(commonHeaders(descriptor, "private, no-store"));
        return res.redirect(302, descriptor.storage.url);
    }
    return sendLocal(res, descriptor, true);
}

module.exports = { inline, download };


import { get } from 'http'
import { readFileSync, writeFileSync, createWriteStream } from 'fs'

const userId = '1222469' // kiki
const writeRants = async (skip) => {
	const url = `https://devrant.com/api/users/${userId}?app=3&content=rants&skip=${skip}`
	const rants = await fetch(url)
		.then((r) => r.json())
		.then((r) => r.profile.content.content.rants)
	if (rants.length === 0) return false
	const lastRant = rants[rants.length - 1]
	writeFileSync('./rants.json', JSON.stringify(rants, null, 2), { flag: 'a+' })
	console.log(`Written from ${skip} to ${skip + 30}. Latest: ${lastRant.id}, "${lastRant.text.slice(0, 30)}"`)
	return true
}

const runtime = async () => {
	let skip = 0

	while (true) {
		await new Promise((res) => setTimeout(res, 500))
		const ok = await writeRants(skip)
		if (ok) skip += 30
		else break
	}

	const mangledRants = readFileSync('./rants.json', { encoding: 'utf8' })
	writeFileSync('./rants.json', mangledRants.replace(/\]\[/g, ','), { encoding: 'utf8' })

	const rants = readFileSync('./rants.json', { flag: 'r' })
	const images = JSON.parse(rants)
		.map((rant) => (rant.attached_image.length === 0 ? null : rant.attached_image.url))
		.filter(Boolean)

	for (let i = 0; i < images.length; i++) {
		const url = images[i]
		const httpUrl = url.replace('https', 'http')
		const nameTuple = url.split('/')
		const name = nameTuple[nameTuple.length - 1]
		await new Promise((resolve, reject) => {
			get(httpUrl, (res) => {
				res.pipe(createWriteStream(`./pics/${name}`))
					.on('finish', resolve)
					.on('error', reject)
			}).on('error', reject)
		})
		console.log(`Wrote ${url}, ${images.length - i - 1} left`)
	}
}

runtime()

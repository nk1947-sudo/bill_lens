import client from './client'

export const analyzeBill = (file, onUploadProgress) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }).then(r => r.data)
}

export const listBills = () => client.get('/history').then(r => r.data)
export const getBill = (id) => client.get(`/history/${id}`).then(r => r.data)
export const deleteBill = (id) => client.delete(`/history/${id}`)

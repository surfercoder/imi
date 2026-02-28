import React from 'react'

const SignatureCanvas = React.forwardRef<
  { clear: () => void; isEmpty: () => boolean; toDataURL: () => string },
  React.CanvasHTMLAttributes<HTMLCanvasElement>
>(() => <canvas data-testid="signature-canvas" />)

SignatureCanvas.displayName = 'SignatureCanvas'

export default SignatureCanvas

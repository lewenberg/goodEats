import Ripple from "./magicui/ripple";
import WordFadeIn from "@/components/magicui/word-fade-in";

const Hero = () => {
  return (
    <div className="relative flex h-[300px] w-full flex-col items-center border-b-2 justify-center overflow-hidden  bg-background md:shadow-xl">
      <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter"> 
    <WordFadeIn words="Taste Which You Love!" /></p>
    <span className="whitespace-pre-wrap text-center text-2xl tracking-tighter">
      <WordFadeIn className="text-2xl font-thin m-2" words="Chinese | Cheetandi | Indian | Everthing
      from your favourite kitchen to your door"/>
    </span>
      <Ripple />
    </div>
  )
}

export default Hero;
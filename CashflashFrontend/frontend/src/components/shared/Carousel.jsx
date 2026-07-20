import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCoverflow,
  Pagination,
  Keyboard,
  Mousewheel,
} from "swiper/modules";

export function CoverflowCarousel({ items, renderItem }) {
  const initial = items.findIndex((i) => i.isDefault);

  return (
    <Swiper
      modules={[EffectCoverflow, Pagination, Keyboard, Mousewheel]}
      effect="coverflow"
      grabCursor
      centeredSlides
      slidesPerView="auto"
      loop={false}
      watchSlidesProgress
      initialSlide={initial >= 0 ? initial : 0}
      resistanceRatio={0}
      spaceBetween={60}
      keyboard={{ enabled: true }}
      mousewheel={{
        forceToAxis: true,
        sensitivity: 0.6,
        releaseOnEdges: true,
      }}
      pagination={{ clickable: true }}
      coverflowEffect={{
        rotate: 0,
        stretch: 0,
        depth: 120,
        modifier: 2,
        slideShadows: false,
      }}
      preventClicks={false}
      preventClicksPropagation={false}
      touchStartPreventDefault={false}
      noSwiping={true}
      noSwipingClass="swiper-no-swiping"
      className="
        w-full py-10
        [&_.swiper-pagination-bullet]:bg-gray-400
        [&_.swiper-pagination-bullet-active]:bg-green-500

        
        [&_.swiper-pagination]:pointer-events-none
        [&_.swiper-pagination-bullet]:pointer-events-auto

       
        [&_.swiper-pagination]:z-0
      "
    >
      {items.map((item) => (
        <SwiperSlide
          key={item.key}
          style={{ width: 320 }}
          className="w-[320px]! transition-all"
        >
          {renderItem(item)}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
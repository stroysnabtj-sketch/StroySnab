export function ConstructionScene() {
  return (
    <svg className="construction-scene" viewBox="0 0 560 490" fill="none" aria-hidden="true">
      <defs>
        <pattern
          id="construction-grid"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
          patternTransform="matrix(1 .48 -1 .48 280 0)"
        >
          <path d="M32 0H0V32" stroke="#e7e5ce" strokeOpacity=".16" />
        </pattern>
        <linearGradient
          id="concrete"
          x1="130"
          y1="230"
          x2="440"
          y2="400"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F5EEDF" />
          <stop offset="1" stopColor="#BEBBA6" />
        </linearGradient>
      </defs>
      <rect width="560" height="490" fill="url(#construction-grid)" />
      <ellipse cx="296" cy="383" rx="206" ry="47" fill="#081F1C" opacity=".3" />
      <path d="m73 322 223-113 204 104-226 119Z" fill="#C7CCB7" />
      <path d="m73 322 201 110v19L73 341Z" fill="#929C89" />
      <path d="m274 432 226-119v19L274 451Z" fill="#6C7D6B" />
      <path d="m130 296 138-70 143 74-140 75Z" fill="url(#concrete)" />
      <path d="M130 296V161l141 76v138Z" fill="#D1CBB7" />
      <path d="m271 237 140-72v135l-140 75Z" fill="#AEB6A0" />
      <path d="m130 161 139-70 142 74-140 72Z" fill="#F0E8D5" />
      <path d="m143 163 126-64 129 66-127 65Z" fill="#D7D7C2" />
      <path d="m276 250 59-30v102l-59 32Z" fill="#2C4C42" />
      <path d="m340 217 57-29v102l-57 30Z" fill="#23483F" />
      <path d="m285 254 41-21v47l-41 22Zm64-33 39-20v47l-39 22Z" fill="#8FAF96" />
      <path d="m285 305 41-21v32l-41 22Zm64-34 39-20v32l-39 22Z" fill="#577B66" />
      <path d="m146 190 90 48v69l-90-48Z" fill="#C16B44" />
      <path
        d="m152 203 77 41m-77-25 77 41m-77-24 77 41m-77-24 77 41m-59-79v16m21-5v17m21-6v17"
        stroke="#E7AA7D"
        strokeWidth="2"
      />
      <path d="m110 157 160-81 160 83-18 10-142-73-141 72Z" fill="#E5B278" />
      <path
        d="m113 144 12-6 144 74-12 6Zm35-18 12-6 144 74-12 6Zm35-18 12-6 144 74-12 6Zm35-18 12-6 144 74-12 6Zm35-18 12-6 144 74-12 6Z"
        fill="#CC8854"
      />
      <path
        d="m113 144 144 74v9l-144-74Zm35-18 144 74v9l-144-74Zm35-18 144 74v9l-144-74Zm35-18 144 74v9L218 99Zm35-18 144 74v9L253 81Z"
        fill="#A96D43"
      />
      <path d="m294 367 57-29 62 32-58 31Z" fill="#EFE8D9" />
      <path d="m294 367 61 34v15l-61-33Zm61 34 58-31v15l-58 31Z" fill="#B8BDA9" />
      <path d="m379 340 23-12 23 12-23 12Z" fill="#E4A277" />
      <path d="m379 340 23 12v21l-23-12Z" fill="#C26944" />
      <path d="m402 352 23-12v21l-23 12Z" fill="#9E5135" />
      <path d="m411 355 23-12 23 12-23 12Z" fill="#E4A277" />
      <path d="m411 355 23 12v21l-23-12Z" fill="#C26944" />
      <path d="m434 367 23-12v21l-23 12Z" fill="#9E5135" />
      <path d="m395 325 23-12 23 12-23 12Z" fill="#E4A277" />
      <path d="m395 325 23 12v21l-23-12Z" fill="#C26944" />
      <path d="m418 337 23-12v21l-23 12Z" fill="#9E5135" />
      <path
        d="m91 349 53-27m-41 35 53-27m-41 35 53-27"
        stroke="#647D6D"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M65 282v-91m-7 91h14m-14-91h14M160 404l-70-37m69 30v14m-69-50v13"
        stroke="#B3C7B1"
        strokeOpacity=".6"
      />
      <circle cx="451" cy="102" r="32" stroke="#A8C2A6" strokeOpacity=".5" />
      <path d="M439 102h24m-12-12v24" stroke="#B7CBAE" />
    </svg>
  );
}
